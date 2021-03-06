import {
  Button,
  Divider,
  FormControl,
  FormLabel,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  useDisclosure,
} from "@chakra-ui/core";
import { CloseIcon } from "@chakra-ui/icons";
import { GetServerSideProps } from "next";
import { ReactElement, useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { api } from "../../../../lib/server/api";
import getVerifiedUser, { APIUser } from "../../../../lib/server/getVerifedUser";
import {
  ArrayContainer,
  BooleanContainer,
  Label,
  MainSection,
  NumberContainer,
  ObjectContainer,
  SchemaContainer,
  StringContainer,
} from "../../../../lib/components/CommonViews";
import ControlledInput from "../../../../lib/components/ControlledInput";
import { BasicSiteLayout } from "../../../../lib/components/SiteLayout";
import { SiteTabs } from "../../../../lib/components/SiteTabs";
import { database } from "../../../../lib/data/database";
import {
  ArraySchema,
  BooleanSchema,
  DEFAULT_SCHEMA,
  DEFAULT_VALUE_SCHEMA,
  getValueSchema,
  NodeSchema,
  NumberSchema,
  ObjectSchema,
  RecordSchema,
  RecordSetSchema,
  SchemaType,
  StringSchema,
  ValueSchema,
  VALUE_TYPES,
} from "../../../../packages/client/src/NodeSchema";
import { siteNodeQuery } from "../../../../lib/data/SiteNodes";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const verifiedUser = await getVerifiedUser(context.req, context.res);
  const siteName = String(context.params?.siteId);
  const childKeys = String(context.params?.childKeys || "").split(",");
  if (!verifiedUser) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }
  const site = await database.site.findUnique({ where: { name: siteName } });
  if (!site) return { redirect: { destination: "/account", permanent: false } };

  const siteQuery = { name: siteName };
  const nodesQuery = siteNodeQuery(siteName, childKeys);
  if (nodesQuery === null) throw new Error("Unexpectd nullfail");
  const nodes = await database.siteNode.findMany({
    where: nodesQuery,
  });
  const node = nodes[0];
  if (!node) {
    return {
      redirect: {
        destination: `/s/${siteName}/dashboard/${childKeys.slice(0, childKeys.length - 1).join("/")}`,
        permanent: false,
      },
    };
  }

  return {
    props: {
      user: verifiedUser,
      siteName,
      address: childKeys,
      node: {
        schema: node.schema || DEFAULT_SCHEMA,
        value: node.value,
      },
    },
  };
};

function StringSchemaEdit({
  label,
  schema,
  onSchema,
}: {
  label: string;
  schema: StringSchema;
  onSchema: (v: ValueSchema) => void;
}) {
  return (
    <StringContainer>
      <Label>{label} - Text</Label>
    </StringContainer>
  );
}

function NumberSchemaEdit({
  label,
  schema,
  onSchema,
}: {
  label: string;
  schema: NumberSchema;
  onSchema: (v: ValueSchema) => void;
}) {
  return (
    <NumberContainer>
      <Label>{label} - Number</Label>
    </NumberContainer>
  );
}

function BooleanSchemaEdit({
  label,
  schema,
  onSchema,
}: {
  label: string;
  schema: BooleanSchema;
  onSchema: (v: ValueSchema) => void;
}) {
  return (
    <BooleanContainer>
      <Label>{label} - Switch</Label>
    </BooleanContainer>
  );
}

function NewKeyForm({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: { name: string; type: SchemaType }) => void;
}) {
  const { register, handleSubmit, errors, control } = useForm({
    mode: "onBlur",
    defaultValues: {
      name: "",
      type: "string" as SchemaType,
    },
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <ModalBody>
        <FormControl>
          <FormLabel htmlFor="name-input">Name</FormLabel>
          <ControlledInput id="name-input" control={control} name="name" />
        </FormControl>
        <FormControl>
          <FormLabel htmlFor="type-select">Type</FormLabel>
          <Controller
            control={control}
            name="type"
            render={({ value, onChange }) => (
              <Select value={value} onChange={onChange} id="type-select">
                {VALUE_TYPES.map(({ key, name }) => (
                  <option key={key} value={key}>
                    {name}
                  </option>
                ))}
              </Select>
            )}
          />
        </FormControl>
      </ModalBody>
      <ModalFooter>
        <Button colorScheme="avenColor" type="submit">
          Save
        </Button>
        <Button onClick={onClose}>Cancel</Button>
      </ModalFooter>
    </form>
  );
}

function ObjectSchemaEdit({
  label,
  schema,
  onSchema,
}: {
  label: string;
  schema: ObjectSchema;
  onSchema: (v: ValueSchema) => void;
}) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <ObjectContainer>
      <Label>{label} Record:</Label>
      {Object.entries(schema.properties).map(([key, keySchema]: [string, ValueSchema]) => (
        <SchemaEdit
          label={key}
          key={key}
          schema={keySchema}
          onSchema={(childSchema) => {
            onSchema({
              ...schema,
              additionalProperties: false,
              properties: {
                ...schema.properties,
                [key]: childSchema,
              },
            });
          }}
        />
      ))}
      <Button onClick={onOpen}>New Entry</Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Object Entry</ModalHeader>
          <ModalCloseButton />
          <NewKeyForm
            onClose={onClose}
            onSubmit={({ name, type }) => {
              onSchema({
                ...schema,
                additionalProperties: false,
                properties: {
                  ...schema.properties,
                  [name]: getValueSchema(type),
                },
              });
              onClose();
            }}
          />
        </ModalContent>
      </Modal>
    </ObjectContainer>
  );
}

function ArraySchemaEdit({
  label,
  schema,
  onSchema,
}: {
  label: string;
  schema: ArraySchema;
  onSchema: (v: ValueSchema) => void;
}) {
  return (
    <ArrayContainer>
      <Label>{label}: List</Label>
      <SchemaEdit
        label={`${label} items`}
        schema={schema.items}
        onSchema={(items) => {
          onSchema({ ...schema, items });
        }}
      />
    </ArrayContainer>
  );
}

function SchemaEdit({
  schema,
  onSchema,
  label,
}: {
  label: string;
  schema: ValueSchema;
  onSchema: (v: ValueSchema) => void;
}) {
  let editor = null;
  if (schema?.type === "string") {
    editor = <StringSchemaEdit schema={schema} onSchema={onSchema} label={label} />;
  }
  if (schema?.type === "number") {
    editor = <NumberSchemaEdit schema={schema} onSchema={onSchema} label={label} />;
  }
  if (schema?.type === "boolean") {
    editor = <BooleanSchemaEdit schema={schema} onSchema={onSchema} label={label} />;
  }
  if (schema?.type === "array") {
    editor = <ArraySchemaEdit schema={schema} onSchema={onSchema} label={label} />;
  }
  if (schema?.type === "object") {
    editor = <ObjectSchemaEdit schema={schema} onSchema={onSchema} label={label} />;
  }
  return (
    <SchemaContainer>
      {editor}

      <Menu>
        <MenuButton as={Button} variant="ghost">
          <CloseIcon />
        </MenuButton>
        <MenuList>
          <MenuItem
            onClick={() => {
              onSchema({ type: "number" });
            }}
          >
            Number
          </MenuItem>
          <MenuItem
            onClick={() => {
              onSchema({ type: "boolean" });
            }}
          >
            Switch
          </MenuItem>
          <MenuItem
            onClick={() => {
              onSchema({ type: "string" });
            }}
          >
            String
          </MenuItem>
          <MenuItem
            onClick={() => {
              onSchema({
                type: "object",
                properties: {},
                additionalProperties: false,
              });
            }}
          >
            Object
          </MenuItem>
          <MenuItem
            onClick={() => {
              onSchema({ type: "array", items: { type: "string" } });
            }}
          >
            Array
          </MenuItem>
        </MenuList>
      </Menu>
    </SchemaContainer>
  );
}

function RecordForm({
  schema,
  onSchema,
  label,
}: {
  label: string;
  schema: RecordSchema;
  onSchema: (r: RecordSchema) => void;
}) {
  const handleRecordSchema = useCallback(
    (record) => {
      onSchema({ ...schema, record });
    },
    [schema],
  );

  return (
    <>
      <SchemaEdit label={label} schema={schema.record || DEFAULT_VALUE_SCHEMA} onSchema={handleRecordSchema} />
    </>
  );
}

function RecordSetForm({
  label,
  schema,
  onSchema,
}: {
  label: string;
  schema: RecordSetSchema;
  onSchema: (r: RecordSetSchema) => void;
}) {
  const handleRecordSchema = useCallback(
    (childRecord) => {
      onSchema({ ...schema, childRecord });
    },
    [schema],
  );

  return (
    <>
      <h3>&quot;{label}&quot; nodes follow the following schema:</h3>
      <SchemaEdit
        label={`${label} type`}
        schema={schema.childRecord || DEFAULT_VALUE_SCHEMA}
        onSchema={handleRecordSchema}
      />
    </>
  );
}

function SchemaForm({ siteName, address, schema }: { siteName: string; address: string[]; schema: NodeSchema }) {
  const [schemaState, setSchema] = useState<NodeSchema>(schema);
  const [draftSchema, setDraftSchema] = useState<NodeSchema>(schema);
  let form = null;
  if (draftSchema.type === "record") {
    form = <RecordForm schema={draftSchema} onSchema={setDraftSchema} label={address[address.length - 1]} />;
  } else if (draftSchema.type === "record-set") {
    form = <RecordSetForm schema={draftSchema} onSchema={setDraftSchema} label={address[address.length - 1]} />;
  }
  return (
    <div>
      {form}
      <Divider />
      {draftSchema !== schemaState && (
        <>
          <Button
            onClick={() => {
              api("node-schema-put", {
                siteName,
                address,
                schema: draftSchema,
              })
                .then(() => {
                  setSchema(draftSchema);
                })
                .catch(console.error);
            }}
            colorScheme="avenColor"
            // disabled={record === schema.record}
          >
            Save Schema
          </Button>
          <Button
            onClick={() => {
              setDraftSchema(schemaState);
            }}
          >
            Cancel
          </Button>
        </>
      )}
    </div>
  );
}

function useClient(siteName: string) {
  // const client = useMemo(() => createClient({ siteName }), []);
  // return client;
}

export default function ChildNodePage({
  user,
  siteName,
  address,
  node,
}: {
  user: APIUser;
  siteName: string;
  address: string[];
  node: {
    value: any;
    schema: NodeSchema;
  };
}): ReactElement {
  // const client = useClient(siteName);
  return (
    <BasicSiteLayout
      user={user}
      isDashboard
      content={
        <>
          <SiteTabs tab="schema" siteName={siteName} address={address} />
          <MainSection>
            <SchemaForm siteName={siteName} address={address} schema={node.schema} />
          </MainSection>
        </>
      }
    />
  );
}
