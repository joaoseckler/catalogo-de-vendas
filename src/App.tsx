import "@mantine/core/styles.css";
import "./styles.css";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  CloseButton,
  Divider,
  Flex,
  Group,
  Image,
  MantineProvider,
  NumberFormatter,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import {
  ArrowDownIcon,
  ArrowsVerticalIcon,
  ArrowUpIcon,
  DotsNineIcon,
  SquareIcon,
  SquaresFourIcon,
  XIcon,
} from "@phosphor-icons/react";
import {
  type CSSProperties,
  type Dispatch,
  memo,
  type SetStateAction,
  startTransition,
  useDeferredValue,
  useMemo,
  useState,
} from "react";
import type { Row } from "./data";
import rows from "./data/sheet.json";
import { theme } from "./theme";

function ShowPrice({
  value,
  perUnit = false,
}: {
  value: number;
  perUnit?: boolean;
}) {
  return (
    <Stack align="flex-end" gap="0">
      <Text fz="xl" fw={700} c="indigo.9">
        <NumberFormatter
          value={value}
          prefix={"R$\u2009"}
          decimalSeparator=","
          thousandSeparator={"\u2009"}
          decimalScale={2}
        ></NumberFormatter>
      </Text>
      {perUnit ? (
        <Text c="gray" fz="sm">
          por unidade
        </Text>
      ) : null}
    </Stack>
  );
}

const ItemCard = memo(({ row }: { row: Row }) => {
  const firstImage = row.imageLinks[0];
  return (
    <Card shadow="md" radius="sm" className="item-card">
      <Card.Section mb="md" bg="indigo.1">
        <Image src={firstImage} alt={row.title} mah={300} fit="contain" />
      </Card.Section>
      <Stack justify="space-between" flex={1}>
        <Group justify="space-between">
          <Stack gap={0}>
            <Title order={3}>{row.title}</Title>
            <Text>{row.description}</Text>
          </Stack>
          <Stack gap="4px" align="flex-end">
            {row.measurements ? (
              <Badge color="indigo">{row.measurements}</Badge>
            ) : null}
            <Badge color="gray">cód. {row.id}</Badge>
          </Stack>
        </Group>
        <ShowPrice value={row.value} perUnit={row.perUnit} />
      </Stack>
    </Card>
  );
});

const Items = memo(({ rows }: { rows: Row[] }) => {
  if (rows.length === 0) {
    return <Text c="gray">Nenhum item encontrado</Text>;
  }

  return rows.map((row) => <ItemCard key={row.id} row={row} />);
});

function SortButton({
  field,
  label,
  sort,
  setSort,
}: {
  field: SortField;
  label: string;
  sort: Sort | null;
  setSort: () => void;
}) {
  const active = sort?.field === field;

  return (
    <Button
      variant={active ? "filled" : "light"}
      onClick={setSort}
      rightSection={
        active ? (
          sort?.dir === "asc" ? (
            <ArrowUpIcon weight="bold" />
          ) : (
            <ArrowDownIcon weight="bold" />
          )
        ) : null
      }
    >
      {label}
    </Button>
  );
}

type Size = "small" | "medium" | "large";
const defaultSize = "large";

function sizeToStyle(size: Size): CSSProperties {
  switch (size) {
    case "small":
      return { "--item-max-width": "180px" } as CSSProperties;
    case "medium":
      return { "--item-max-width": "250px" } as CSSProperties;
    case "large":
      return { "--item-max-width": "500px" } as CSSProperties;
    default:
      return {};
  }
}

function SizeControl({
  size,
  setSize,
}: {
  size: Size;
  setSize: (size: Size) => void;
}) {
  return (
    <ActionIcon.Group>
      <ActionIcon
        size="lg"
        variant={size === "small" ? "filled" : "light"}
        onClick={() => setSize("small")}
      >
        <DotsNineIcon size={30} />
      </ActionIcon>
      <ActionIcon
        variant={size === "medium" ? "filled" : "light"}
        size="lg"
        onClick={() => setSize("medium")}
      >
        <SquaresFourIcon size={30} />
      </ActionIcon>
      <ActionIcon
        variant={size === "large" ? "filled" : "light"}
        size="lg"
        onClick={() => setSize("large")}
      >
        <SquareIcon size={30} />
      </ActionIcon>
    </ActionIcon.Group>
  );
}

function SearchControls({
  setQuery,
  setSort,
  setSize,
}: {
  setQuery: (value: string) => void;
  setSort: Dispatch<SetStateAction<Sort | null>>;
  setSize: Dispatch<SetStateAction<Size>>;
}) {
  const [value, setValue] = useState("");
  const [sort, setInnerSort] = useState<Sort | null>(null);
  const [size, setInnerSize] = useState<Size>(defaultSize);

  function handleSort(value: Sort | null) {
    setInnerSort(value);
    startTransition(() => {
      setSort(value);
    });
  }

  function toggleSort(field: SortField) {
    setInnerSort((s) => {
      const newSort = {
        field,
        dir: (s?.field === field && s?.dir === "asc"
          ? "desc"
          : "asc") as SortDir,
      };

      startTransition(() => {
        setSort(newSort);
      });

      return newSort;
    });
  }

  function handleSearch(value: string) {
    setValue(value);
    startTransition(() => {
      setQuery(value);
    });
  }

  function handleSize(value: Size) {
    setInnerSize(value);
    startTransition(() => {
      setSize(value);
    });
  }

  return (
    <Flex columnGap="xl" rowGap="md" wrap="wrap">
      <TextInput
        maw={250}
        value={value}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="pesquisar..."
        rightSection={<CloseButton onClick={() => handleSearch("")} />}
      />
      <Button.Group>
        <Button.GroupSection variant="light" p="xs">
          <ArrowsVerticalIcon size={16} />
        </Button.GroupSection>
        <SortButton
          field="price"
          label="preço"
          sort={sort}
          setSort={() => toggleSort("price")}
        />
        <SortButton
          field="name"
          label="nome"
          sort={sort}
          setSort={() => toggleSort("name")}
        />
        <SortButton
          field="code"
          label="código"
          sort={sort}
          setSort={() => toggleSort("code")}
        />
        <Button
          p="xs"
          variant="light"
          onClick={() => handleSort(null)}
          aria-label="fechar"
        >
          <XIcon size={16} />
        </Button>
      </Button.Group>
      <Box visibleFrom="sm">
        <SizeControl size={size} setSize={handleSize} />
      </Box>
    </Flex>
  );
}

type SortField = "price" | "name" | "code";
type SortDir = "asc" | "desc";
type Sort = {
  field: SortField;
  dir: SortDir;
};

export default function App() {
  const [value, setValue] = useState("");
  const [debouncedValue] = useDebouncedValue(value, 500);
  const deferredValue = useDeferredValue(debouncedValue);
  const [sort, setSort] = useState<Sort | null>(null);
  const [size, setSize] = useState<Size>(defaultSize);

  const filteredRows = useMemo(() => {
    const searchValue = deferredValue.toLowerCase();
    return rows
      .filter((row) => {
        return (
          row.title.toLowerCase().includes(searchValue) ||
          row.description.toLowerCase().includes(searchValue)
        );
      })
      .sort((a, b) => {
        if (!sort?.field && !sort?.dir) return 0;

        let compareValue = 0;

        if (sort.field === "price") {
          compareValue = a.value - b.value;
        } else if (sort.field === "name") {
          compareValue = a.title.localeCompare(b.title);
        } else if (sort.field === "code") {
          compareValue = a.id - b.id;
        }

        return sort.dir === "asc" ? compareValue : -compareValue;
      });
  }, [deferredValue, sort?.field, sort?.dir]);

  return (
    <MantineProvider theme={theme}>
      <header>
        <Title order={1}>Mobília e decoração à venda</Title>
        <Text fz="xl" c="gray">
          catálogo de objetos
        </Text>
        <Divider mt="xl" mb="md" />
        <Text c="indigo.9">venda de objetos em excelente estado</Text>
        <Text c="indigo.9">valores negociáveis</Text>
        <Text c="indigo.9">retirada no Alto de Pinheiros</Text>
        <Text c="indigo.9">tratar com João: (11) 99749-8886</Text>
        <Divider my="md" />
        <SearchControls
          setQuery={setValue}
          setSort={setSort}
          setSize={setSize}
        />
      </header>
      <main style={sizeToStyle(size)}>
        <Items rows={filteredRows}></Items>
      </main>
    </MantineProvider>
  );
}
