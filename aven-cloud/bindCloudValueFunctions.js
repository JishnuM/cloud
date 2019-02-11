import { filter } from 'rxjs/operators';

function flatArray(a) {
  return [].concat.apply([], a);
}

function computeLambdaResult(
  argumentValue,
  lambdaValue,
  docContext,
  cloudClient,
  options,
) {
  const evalCode = `({useValue}) => {
    // console.log = () => {};
    return ${lambdaValue.code};
  }`;

  const lambdaContext = eval(evalCode);

  const dependencies = new Set();
  function useValue(cloudValue) {
    dependencies.add(cloudValue);
    return cloudValue.getValue();
  }
  const lambda = lambdaContext({ useValue });

  function computeResult() {
    if (typeof lambda !== 'function') {
      return null;
    }
    return lambda(argumentValue, docContext, cloudClient, options);
  }

  return {
    result: computeResult(),
    dependencies,
    reComputeResult: computeResult,
  };
}

function filterUndefined() {
  return filter(value => value !== undefined);
}

function expandCloudValue(cloudValue, cloudClient, expandFn) {
  function isCloudValue(o) {
    return (
      o != null &&
      typeof o === 'object' &&
      typeof o.observeValue === 'object' &&
      typeof o.observeValue.subscribe === 'function' &&
      typeof o.fetchValue === 'function' &&
      typeof o.getValue === 'function'
    );
  }
  function doExpansion(o) {
    if (o == null) {
      return [];
    } else if (isCloudValue(o)) {
      return o.getValue();
    } else if (o instanceof Array) {
      return o.map(doExpansion);
    } else if (typeof o === 'object') {
      const out = {};
      Object.keys(o).forEach(k => {
        out[k] = doExpansion(o[k]);
      });
      return out;
    }
    return o;
  }
  function collectCloudValues(o) {
    if (o == null) {
      return [];
    } else if (isCloudValue(o)) {
      return [o];
    } else if (o instanceof Array) {
      return flatArray(o.map(collectCloudValues));
    } else if (!!o && typeof o === 'object') {
      return flatArray(Object.values(o).map(collectCloudValues));
    }
    return [];
  }
  const expanded = {
    type: 'ExpandedDoc',
    getFullName: () => {
      return cloudValue.getFullName() + '__expanded';
    },
    get: toGet => {
      throw new Error(
        `Cannot get "${toGet}" on ${cloudValue.getFullName()} because it has been evaluated.`,
      );
    },
    fetchValue: async () => {
      await cloudValue.fetchValue();
      const expandSpec = expandFn(cloudValue.getValue(), cloudValue);
      const cloudValues = collectCloudValues(expandSpec);
      await Promise.all(cloudValues.map(v => v.fetchValue()));
    },
    observeValue: cloudValue.observeValue
      .distinctUntilChanged()
      .pipe(filterUndefined())
      .mergeMap(async o => {
        const expandSpec = expandFn(o, cloudValue);
        const cloudValues = collectCloudValues(expandSpec);
        await Promise.all(cloudValues.map(v => v.fetchValue()));
        const expanded = doExpansion(expandSpec);
        return expanded;
      })
      .pipe(filterUndefined())
      .distinctUntilChanged(),
    getValue: () => {
      const o = cloudValue.getValue();
      const expandSpec = expandFn(o, cloudValue);
      const expanded = doExpansion(expandSpec);
      return expanded;
    },
  };
  bindCloudValueFunctions(expanded, cloudClient);
  return expanded;
}

function evalCloudValue(cloudValue, cloudClient, lambdaDoc) {
  const evaluatedDoc = {
    type: 'EvaluatedDoc',
    getFullName: () => {
      return cloudValue.getFullName() + '__evalby_' + lambdaDoc.getFullName();
    },
    get: toGet => {
      throw new Error(
        `Cannot get "${toGet}" on ${cloudValue.getFullName()} because it has been evaluated.`,
      );
    },
    fetchValue: async () => {
      await cloudValue.fetchValue();
      await lambdaDoc.fetchValue();

      // run once to fill dependencies
      const { dependencies, reComputeResult } = computeLambdaResult(
        cloudValue.getValue(),
        lambdaDoc.getValue(),
        cloudValue,
        cloudClient,
        {},
      );

      await Promise.all(
        [...dependencies].map(async dep => {
          await dep.fetchValue();
        }),
      );

      return reComputeResult();
    },
    observeValue: lambdaDoc.observeValue
      .distinctUntilChanged()
      .switchMap(lambdaDocValue => {
        return cloudValue.observeValue
          .distinctUntilChanged()
          .flatMap(async argumentValue => {
            if (argumentValue == null || lambdaDocValue == null) {
              return null;
            }
            const { dependencies, reComputeResult } = computeLambdaResult(
              argumentValue,
              lambdaDocValue,
              cloudValue,
              cloudClient,
              {},
            );

            await Promise.all(
              [...dependencies].map(async dep => {
                await dep.fetchValue();
              }),
            );

            return reComputeResult();
          });
      })
      .pipe(filterUndefined())
      .distinctUntilChanged(),
    getValue: () => {
      const { result } = computeLambdaResult(
        cloudValue.getValue(),
        lambdaDoc.getValue(),
        cloudValue,
        cloudClient,
        {},
      );
      return result;
    },
  };
  bindCloudValueFunctions(evaluatedDoc, cloudClient);
  return evaluatedDoc;
}

function mapCloudValue(cloudValue, cloudClient, mapFn) {
  const mapped = {
    type: 'MappedDoc',
    getFullName: () => {
      return cloudValue.getFullName() + '__mapped';
    },
    get: toGet => {
      throw new Error(
        `Cannot get "${toGet}" on ${cloudValue.getFullName()} because it has been mapped.`,
      );
    },
    fetchValue: cloudValue.fetchValue,
    observeValue: cloudValue.observeValue.distinctUntilChanged().map(data => {
      return mapFn(data);
    }),
    // distinctUntilChanged(),
    getValue: () => {
      return mapFn(cloudValue.getValue());
    },
  };

  bindCloudValueFunctions(mapped, cloudClient);
  return mapped;
}

export default function bindCloudValueFunctions(cloudValue, cloudClient) {
  cloudValue.map = (...args) => mapCloudValue(cloudValue, cloudClient, ...args);
  cloudValue.expand = (...args) =>
    expandCloudValue(cloudValue, cloudClient, ...args);
  cloudValue.eval = (...args) =>
    evalCloudValue(cloudValue, cloudClient, ...args);
}
