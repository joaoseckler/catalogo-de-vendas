import "@mantine/core/styles.css";
import "./styles.css";
import {
  ActionIcon,
  Box,
  Button,
  CloseButton,
  Divider,
  Flex,
  Group,
  Image,
  MantineProvider,
  Text,
  TextInput,
  Title,
  Typography,
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
  type SetStateAction,
  startTransition,
  useDeferredValue,
  useMemo,
  useState,
} from "react";
import ReactMarkdown from "react-markdown";
import rows from "./data/sheet.json";
import site from "./data/site.json";
import Items from "./items";
import { theme } from "./theme";

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
const smallStyles = {
  "--item-header-direction": "column",
  "--item-badges-align": "flex-start",
};

function sizeToStyle(size: Size): CSSProperties {
  switch (size) {
    case "small":
      return { "--item-max-width": "180px", ...smallStyles } as CSSProperties;
    case "medium":
      return { "--item-max-width": "250px", ...smallStyles } as CSSProperties;
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
        title="ver itens em tamanho pequeno"
      >
        <DotsNineIcon size={30} />
      </ActionIcon>
      <ActionIcon
        variant={size === "medium" ? "filled" : "light"}
        size="lg"
        onClick={() => setSize("medium")}
        title="ver itens em tamanho médio"
      >
        <SquaresFourIcon size={30} />
      </ActionIcon>
      <ActionIcon
        variant={size === "large" ? "filled" : "light"}
        size="lg"
        onClick={() => setSize("large")}
        title="ver itens em tamanho grande"
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
    <Flex
      className="print-hide search-controls"
      columnGap="xl"
      rowGap="md"
      wrap="wrap"
    >
      <TextInput
        maw={250}
        value={value}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="pesquisar..."
        rightSection={
          <CloseButton
            onClick={() => handleSearch("")}
            title="limpar pesquisa"
          />
        }
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
          title="remover ordenação"
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
      {"extraCss" in site ? <style>{site.extraCss}</style> : null}
      <header>
        <Group align="center" gap="xs">
          <Image
            src="logo.webp"
            w={65}
            role="presentation"
            id="logo"
            alt={site.title}
          />
          <div>
            <Title order={1} id="title">
              {site.title}
            </Title>
            <Text fz="xl" c="gray" id="subtitle">
              {site.subtitle}
            </Text>
          </div>
        </Group>
        <Divider mt="xl" mb="md" />

        <Typography id="description">
          <ReactMarkdown>{site.description}</ReactMarkdown>
        </Typography>
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
