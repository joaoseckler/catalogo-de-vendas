import "@mantine/core/styles.css";
import "./styles.css";
import {
  ActionIcon,
  Anchor,
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
  Modal,
  NumberFormatter,
  Stack,
  Text,
  TextInput,
  Title,
  useMatches,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import {
  ArrowCircleLeftIcon,
  ArrowCircleRightIcon,
  ArrowDownIcon,
  ArrowsVerticalIcon,
  ArrowUpIcon,
  DotsNineIcon,
  SquareIcon,
  SquaresFourIcon,
  WhatsappLogoIcon,
  XIcon,
} from "@phosphor-icons/react";
import {
  type CSSProperties,
  type Dispatch,
  memo,
  type SetStateAction,
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Row } from "./data";
import rows from "./data/sheet.json";
import { theme } from "./theme";

const publicPath = import.meta.env.BASE_URL || "";

function urlJoin(a: string, b: string) {
  if (a.endsWith("/")) {
    a = a.slice(0, -1);
  }
  if (b.startsWith("/")) {
    b = b.slice(1);
  }
  return `${a}/${b}`;
}

function whatsappLink(row: Row) {
  const telephone = "5511997498886";
  const text = `Olá! Tenho interesse no item _${row.title}_ do catálogo de vendas (código ${row.id})`;
  return `https://wa.me/${telephone}?text=${encodeURIComponent(text)}`;
}

function ShowPrice({
  value,
  perUnit = false,
}: {
  value: number;
  perUnit?: boolean;
}) {
  return (
    <Stack gap="0">
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

const ItemCard = memo(
  ({
    row,
    selected = false,
    setDialog,
    imageIndex = 0,
    nextImage,
    previousImage,
  }: {
    row: Row;
    dialogId?: number | null;
    selected?: boolean;
    setDialog?: (id: number | null) => void;
    imageIndex?: number;
    nextImage?: () => void;
    previousImage?: () => void;
  }) => {
    const selectedImage = row.imageLinks[imageIndex];
    const available = row.status === "";

    return (
      <Card
        shadow="md"
        radius="sm"
        className="item-card"
        style={{
          opacity: available ? 1 : 0.5,
        }}
      >
        <Card.Section
          component={selected ? undefined : "button"}
          disabled={!available}
          bd="none"
          mb="md"
          bg="indigo.1"
          onClick={(e) => {
            e.preventDefault();
            if (setDialog && available) setDialog(row.id);
          }}
          style={{
            cursor: setDialog && available ? "pointer" : "default",
            outlineColor: "var(--mantine-color-indigo-9)",
          }}
        >
          <Image
            src={urlJoin(publicPath, selectedImage)}
            alt={row.title}
            mah={selected ? "65vh" : 300}
            fit="contain"
          />
        </Card.Section>
        <Stack justify="space-between" flex={1}>
          <Flex
            className="item-header"
            justify="space-between"
            align="flex-start"
          >
            <Stack gap={0}>
              <Title order={3}>{row.title}</Title>
              <Text>{row.description}</Text>
            </Stack>
            <Stack className="item-badges">
              {!available ? (
                <Badge
                  color={row.status === "reservado" ? "orange" : "red"}
                  variant="filled"
                >
                  {row.status === "reservado" ? "reservado" : "vendido"}
                </Badge>
              ) : null}
              {row.measurements ? <Badge>{row.measurements}</Badge> : null}
              <Badge color="gray">cód. {row.id}</Badge>
            </Stack>
          </Flex>
          <Group justify="space-between" align="flex-end">
            <ShowPrice value={row.value} perUnit={row.perUnit} />
            <Button
              component={available ? "a" : undefined}
              href={whatsappLink(row)}
              target="_blank"
              color="lime.7"
              size="sm"
              rightSection={<WhatsappLogoIcon size={20} />}
              className="print-hide"
              disabled={!available}
            >
              tenho interesse
            </Button>
          </Group>
        </Stack>
        {row.imageLinks.length > 1 ? (
          <Badge
            variant="outline"
            className="top-left print-hide"
            bg="indigo.1"
          >
            {imageIndex + 1}/{row.imageLinks.length}
          </Badge>
        ) : null}
        {selected && setDialog ? (
          <CloseButton
            className="top-right"
            onClick={() => setDialog(null)}
            title="fechar janela"
          />
        ) : null}
        {previousImage ? (
          <ActionIcon
            variant="transparent"
            title="imagem anterior"
            onClick={previousImage}
            className="middle-left"
            size="lg"
          >
            <ArrowCircleLeftIcon size={36} />
          </ActionIcon>
        ) : null}
        {nextImage ? (
          <ActionIcon
            variant="transparent"
            title="próxima imagem"
            onClick={nextImage}
            className="middle-right"
            size="lg"
          >
            <ArrowCircleRightIcon size={36} />
          </ActionIcon>
        ) : null}
      </Card>
    );
  },
);

const Items = memo(({ rows }: { rows: Row[] }) => {
  const [dialogId, setDialogId] = useState<number | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const showDialog = useMatches({ md: true });
  const selectedRow = useMemo(
    () => rows.find((r) => r.id === dialogId) || null,
    [dialogId, rows],
  );

  const setDialog = useCallback((id: number | null) => {
    setDialogId(id);
    setImageIndex(0);
  }, []);

  const nextImage = useCallback(() => {
    if (!selectedRow) return;
    setImageIndex((i) => (i + 1) % selectedRow.imageLinks.length);
  }, [selectedRow]);

  const previousImage = useCallback(() => {
    if (!selectedRow) return;
    setImageIndex((i) => (i === 0 ? selectedRow.imageLinks.length - 1 : i - 1));
  }, [selectedRow]);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (dialogId === null) return;

      if (e.key === "ArrowRight") {
        nextImage();
      } else if (e.key === "ArrowLeft") {
        previousImage();
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [dialogId, nextImage, previousImage]);

  if (rows.length === 0) {
    return <Text c="gray">Nenhum item encontrado</Text>;
  }

  return (
    <>
      {rows.map((row) => (
        <ItemCard
          key={row.id}
          row={row}
          setDialog={showDialog ? setDialog : undefined}
        />
      ))}
      <Modal
        opened={dialogId !== null}
        onClose={() => setDialog(null)}
        withCloseButton={false}
        padding={0}
        centered
        size="auto"
        style={{ "--item-max-width": "90vw" } as CSSProperties}
      >
        {selectedRow ? (
          <ItemCard
            row={selectedRow}
            selected
            setDialog={setDialogId}
            imageIndex={imageIndex}
            nextImage={
              imageIndex < selectedRow.imageLinks.length - 1
                ? nextImage
                : undefined
            }
            previousImage={imageIndex > 0 ? previousImage : undefined}
          />
        ) : null}
      </Modal>
    </>
  );
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
      <header>
        <Group align="center" gap="xs">
          <Image src="favicon.svg" w={30} mt="4px" role="presentation" />
          <Title order={1}>Mobília e decoração à venda</Title>
        </Group>
        <Text fz="xl" c="gray">
          catálogo de objetos
        </Text>
        <Divider mt="xl" mb="md" />
        <Text c="indigo.9">venda de objetos em excelente estado</Text>
        <Text c="indigo.9">valores negociáveis</Text>
        <Text c="indigo.9">retirada no Alto de Pinheiros</Text>
        <Text c="indigo.9">
          tratar com João:{" "}
          <Anchor c="indigo.9" underline="always" href="tel:+5511997498886">
            (11) 99749-8886
          </Anchor>
        </Text>
        <Text c="indigo.9">indicar o código do item desejado</Text>
        <Text c="indigo.9" className="print-only">
          versão online:{" "}
          <Anchor
            c="indigo.9"
            underline="always"
            href="https://jseckler.xyz/catalogo"
          >
            jseckler.xyz/catalogo
          </Anchor>
        </Text>
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
