import { Observable, BehaviorSubject } from 'rxjs-compat';
import createCloudObject from './createCloudObject';
import uuid from 'uuid/v1';
const pathJoin = require('path').join;

const observeNull = Observable.create(observer => {
  observer.next(null);
});
const observeStatic = val =>
  Observable.create(observer => {
    observer.next(val);
  });

export const POSTING_REF_NAME = Symbol('POSTING_REF_NAME');

function hasDepth(name) {
  return name.match(/\//);
}

export function createRefPool({
  objectCache,
  domain,
  dataSource,
  onGetParentName,
}) {
  const _refs = {};

  function get(name) {
    const localName = name.split('/')[0];
    let restOfName = null;
    if (localName.length < name.length - 1) {
      restOfName = name.slice(localName.length + 1);
    }
    if (!_refs[localName]) {
      _refs[localName] = createCloudRef({
        dataSource,
        domain,
        name: localName,
        objectCache: objectCache,
        onRename: newName => move(localName, newName),
        onGetParentName,
      });
    }
    if (restOfName) {
      return _refs[localName].get(restOfName);
    }
    return _refs[localName];
  }

  function move(fromName, toName) {
    if (hasDepth(fromName)) {
      throw new Error(
        `Cannot move from "${fromName}" because it has a slash. Deep moves are not supported yet.`,
      );
    }
    if (hasDepth(toName)) {
      throw new Error(
        `Cannot move to "${toName}" because it has a slash. Deep moves are not supported yet.`,
      );
    }
    _refs[toName] = _refs[fromName];
    _refs[toName].$setName(toName);
    delete _refs[fromName];
  }

  function post() {
    const localName = uuid();
    _refs[localName] = createCloudRef({
      dataSource,
      domain,
      name: localName,
      objectCache: objectCache,
      onGetParentName,
      onRename: newName => move(localName, newName),
      isUnposted: true,
    });
    return _refs[localName];
  }

  return { get, move, post };
}

export default function createCloudRef({
  dataSource,
  name,
  domain,
  onGetParentName,
  isUnposted,
  onRename,
  ...opts
}) {
  const objectCache = opts.objectCache || {};

  if (!name) {
    throw new Error('name must be provided to createCloudRef!');
  }
  if (name.match(/\//)) {
    throw new Error(
      `ref name ${name} must not contain slashes. Instead, pass a parent`,
    );
  }
  if (!domain) {
    throw new Error('domain must be provided to createCloudRef!');
  }

  const refState = new BehaviorSubject({
    name,
    id: null,
    isConnected: false,
    lastSyncTime: null,
    isDestroyed: false,
    isPosted: !isUnposted,
  });

  let postingInProgress = null;

  async function ensurePosted(obj) {
    if (refState.value.isPosted) {
      return null;
    }
    const parent = onGetParentName();
    const puttingFromId = r.id;
    setState({
      id: obj.id,
      puttingFromId,
    });
    if (!postingInProgress) {
      let postData = { id: null };
      if (obj && obj.getValue()) {
        postData = { value: obj.getValue() };
      } else if (obj) {
        postData = { id: obj.id };
      }
      postingInProgress = dataSource.dispatch({
        type: 'PostRef',
        name: parent,
        domain,
        ...postData,
      });
    }
    let result = null;
    try {
      result = await postingInProgress;
      setState({
        puttingFromId: null,
        lastPutTime: Date.now(),
      });
    } catch (e) {
      setState({
        puttingFromId: null,
        id: puttingFromId,
      });
    } finally {
      postingInProgress = null;
    }
    if (result.name) {
      const resultingChildName = result.name.slice(parent.length + 1);
      onRename(resultingChildName);
      setState({
        isPosted: true,
      });
      if (obj.id === result.id) {
        return obj;
      }
      return null; // probably this is not an error because there may have been race conditions with multiple calls to ensurePosted
    }
    throw new Error('Could not post this ref!');
  }

  const setState = newState => {
    console.log('Ref setState of ' + getFullName(), newState);
    refState.next({
      ...refState.value,
      ...newState,
    });
  };

  function getState() {
    return refState.value;
  }

  function getName() {
    const name = refState.value.name;
    return name;
  }

  function getFullName() {
    const name = getName();
    const parent = onGetParentName();
    if (parent) {
      return pathJoin(parent, name);
    }
    return name;
  }

  const refs = createRefPool({
    onGetParentName: getFullName,
    objectCache,
    dataSource,
    domain,
  });

  async function fetch() {
    const result = await dataSource.dispatch({
      type: 'GetRef',
      domain,
      name: getFullName(),
    });
    if (result) {
      setState({
        id: result.id,
        lastSyncTime: Date.now(),
      });
    }
  }

  async function destroy() {
    setState({ isConnected: false, id: null, isDestroyed: true });
    await dataSource.dispatch({
      type: 'DestroyRef',
      domain,
      name: getFullName(),
    });
  }

  async function fetchValue() {
    await fetch();
    const obj = getObject();
    if (obj) {
      await obj.fetch();
    }
  }
  const observe = Observable.create(observer => {
    // todo, re-observe when name changes!!
    let upstreamSubscription = null;
    const myName = getFullName();
    dataSource.observeRef(domain, myName).then(upstreamObs => {
      setState({ isConnected: true });
      upstreamSubscription = upstreamObs.subscribe({
        next: upstreamRef => {
          console.log('has upstream!!!' + getFullName(), upstreamRef);
          setState({
            id: upstreamRef.id,
            lastSyncTime: Date.now(),
            value: upstreamRef.value,
          });
          observer.next(refState.value);
        },
      });
    });

    return () => {
      setState({ isConnected: false });
      upstreamSubscription && upstreamSubscription.unsubscribe();
    };
  })
    .multicast(() => new BehaviorSubject(refState.value))
    .refCount();

  function _namedDispatch(action) {
    return dataSource.dispatch({
      ...action,
      domain,
      name: getFullName(),
    });
  }
  function _getObjectWithId(id) {
    if (objectCache[id]) {
      return objectCache[id];
    }
    const o = (objectCache[id] = createCloudObject({
      onNamedDispatch: _namedDispatch,
      id,
    }));
    return o;
  }

  function _getObjectWithValue(value) {
    const obj = createCloudObject({
      onNamedDispatch: _namedDispatch,
      value,
    });

    if (objectCache[obj.id]) {
      return objectCache[obj.id];
    }
    return (objectCache[obj.id] = obj);
  }

  function getObject(requestedId) {
    if (requestedId) {
      return _getObjectWithId(requestedId);
    }
    const { id } = refState.value;
    if (!id) {
      return undefined;
    }
    return _getObjectWithId(id);
  }

  function getValue() {
    const { id, value } = refState.value;
    if (value) {
      return value;
    }
    if (!id) {
      return undefined;
    }
    const obj = _getObjectWithId(id);
    return obj.getValue();
  }

  async function put(value) {
    const obj = _getObjectWithValue(value);
    await putObject(obj);
  }

  async function putId(objId) {
    await dataSource.dispatch({
      type: 'PutRef',
      domain,
      name: getFullName(),
      id: objId,
    });
  }

  async function write(value) {
    await ensurePosted();
    const obj = _getObjectWithValue(value);
    await obj.put();
    return { id: obj.id };
  }

  async function putObject(obj) {
    const postResult = await ensurePosted(obj);
    if (postResult === obj) {
      return;
    }

    const state = getState();
    if (state.puttingFromObjectId) {
      throw new Error(
        `Cannot putObject of "${name}" while another put is in progress!`,
      );
    }
    const lastId = state.id;
    setState({
      id: obj.id,
      puttingFromId: state.id,
    });
    try {
      await obj.put();
      await putId(obj.id);

      setState({
        puttingFromId: null,
        lastPutTime: Date.now(),
      });
    } catch (e) {
      setState({
        puttingFromId: null,
        id: lastId,
      });
      console.error(e);
      throw new Error(`Failed to putObjectId "${obj.id}" to "${name}"!`);
    }
  }

  const observeValue = observe
    .map(rr => {
      if (rr.value !== undefined) {
        console.log('------------RING DIGN DING DING');
        return observeStatic(r.value);
      }
      if (!rr.id) {
        console.log('ref observing null', getFullName());
        return observeNull;
      }
      const obj = _getObjectWithId(rr.id);
      console.log('ref observe object value', getFullName(), rr.id);
      return obj.observeValue;
    })
    .switch();

  function lookupRefObject(inputVal, lookup) {
    let refVal = inputVal;
    lookup.forEach(v => {
      refVal = refVal && refVal[v];
    });
    if (refVal == null) {
      return observeNull;
    }
    if (typeof refVal !== 'string') {
      throw new Error(
        `Cannot look up object ID in ${name} on ${lookup.join()}`,
      );
    }
    const connectedObj = _getObjectWithId(refVal);
    return connectedObj;
  }
  function observeConnectedValue(lookup) {
    return observeValue
      .map(value => {
        if (!value) {
          return observeNull;
        }
        const connected = lookupRefObject(value, lookup);
        return connected.observeValue;
      })
      .switch();
  }

  async function fetchConnectedValue(lookup) {
    await fetchValue();
    const connected = lookupRefObject(getValue(), lookup);
    if (connected) {
      await connected.fetch();
    }
  }

  async function getConnectedValue(lookup) {
    const obj = getObject();
    const connected = lookupRefObject(obj.value, lookup);
    if (connected) {
      return connected.getValue();
    }
  }

  async function transact(transactionFn) {
    await fetchValue();
    const newValue = transactionFn(getValue());
    await put(newValue);
  }

  function $setName(newName) {
    setState({
      name: newName,
    });
    // todo, send this to the server!
  }

  const r = {
    $setName,
    get: refs.get,
    post: refs.post,
    getState,
    getName,
    getFullName,
    domain,
    fetch,
    put,
    putId,
    putObject,
    fetchValue,
    fetchConnectedValue,
    getConnectedValue,
    getObject,
    getValue,
    observeValue,
    observe,
    write,
    destroy,
    observeConnectedValue,
    transact,
  };

  function flatArray(a) {
    return [].concat.apply([], a);
  }

  function expand(expandFn) {
    function isCloudValue(o) {
      return (
        typeof o === 'object' &&
        typeof o.observeValue === 'object' &&
        typeof o.observeValue.subscribe === 'function' &&
        typeof o.fetchValue === 'function' &&
        typeof o.getValue === 'function'
      );
    }
    function doExpansion(o) {
      if (isCloudValue(o)) {
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
      if (isCloudValue(o)) {
        return [o];
      } else if (o instanceof Array) {
        return flatArray(o.map(collectCloudValues));
      } else if (typeof o === 'object') {
        return flatArray(Object.values(o).map(collectCloudValues));
      }
      return [];
    }
    return {
      ...r,
      fetchValue: async () => {
        await r.fetchValue();
        const expandSpec = expandFn(r.getValue(), r);
        const cloudValues = collectCloudValues(expandSpec);
        await Promise.all(cloudValues.map(v => v.fetchValue()));
      },
      observeValue: r.observeValue
        .distinctUntilChanged()
        .mergeMap(async o => {
          const expandSpec = expandFn(o, r);
          const cloudValues = collectCloudValues(expandSpec);
          await Promise.all(cloudValues.map(v => v.fetchValue()));
          const expanded = doExpansion(expandSpec);
          return expanded;
        })
        .distinctUntilChanged(),
      getValue: () => {
        const o = r.getValue();
        const expandSpec = expandFn(o, r);
        const expanded = doExpansion(expandSpec);
        return expanded;
      },
    };
  }
  r.expand = expand;

  function map(mapFn) {
    return {
      ...r,
      map: innerMapFn => r.map(v => innerMapFn(mapFn(v))),
      observeValue: r.observeValue
        .distinctUntilChanged()
        .map(data => {
          return mapFn(data);
        })
        .distinctUntilChanged(),
      getValue: () => {
        return mapFn(r.getValue());
      },
    };
  }
  r.map = map;

  return r;
}
