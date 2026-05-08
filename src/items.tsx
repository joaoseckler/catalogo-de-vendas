import "@mantine/core/styles.css";
import { useSwipeable } from "react-swipeable";
import "./styles.css";
import {
  ActionIcon,
  alpha,
  Badge,
  Box,
  Button,
  Card,
  CloseButton,
  CopyButton,
  Flex,
  Group,
  Image,
  Modal,
  NumberFormatter,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  ArrowCircleLeftIcon,
  ArrowCircleRightIcon,
  CopyIcon,
  ShareIcon,
  WhatsappLogoIcon,
} from "@phosphor-icons/react";
import {
  type CSSProperties,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Row } from "./data";
import site from "./data/site.json";
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
  const telephone = site.cellphone.replace(/\D/g, "");
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
    <Stack gap="0" style={{ flexShrink: 0 }}>
      <Text fz="xl" fw={700} c={`${theme.primaryColor}.9`}>
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

function ShowCategory({ category }: { category?: string | null }) {
  if (!category) return null;
  return <Box className="item-category">{category}</Box>;
}

function isAvailable(status: Row["status"]) {
  // Return true or false for availability. Return null for hidden items.

  if (status === "à venda" || status === "") {
    return true;
  } else if (status === "reservado") {
    return site.showReserved ? false : null;
  } else if (status === "vendido") {
    return site.showSold ? false : null;
  } else if (status === "não localizado") {
    return null;
  }

  return true;
}

function ItemCardModal({
  row,
  dialogId,
  setDialog,
  imageIndex = 0,
  nextImage,
  previousImage,
}: {
  row: Row | null;
  dialogId: number | null;
  setDialog: (id: number | null) => void;
  imageIndex?: number;
  nextImage?: () => void;
  previousImage?: () => void;
}) {
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (nextImage) nextImage();
    },
    onSwipedRight: () => {
      if (previousImage) previousImage();
    },
    trackMouse: false,
  });

  return (
    <Modal
      opened={dialogId !== null}
      onClose={() => setDialog(null)}
      withCloseButton={false}
      padding={0}
      centered
      size="auto"
      style={{ "--item-max-width": "90vw" } as CSSProperties}
      {...swipeHandlers}
    >
      {row ? (
        <ItemCard
          row={row}
          selected
          setDialog={setDialog}
          imageIndex={imageIndex}
          nextImage={
            imageIndex < row.imageLinks.length - 1 ? nextImage : undefined
          }
          previousImage={imageIndex > 0 ? previousImage : undefined}
          showShare={true}
        />
      ) : null}
    </Modal>
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
    showShare = false,
  }: {
    row: Row;
    dialogId?: number | null;
    selected?: boolean;
    setDialog?: (id: number | null) => void;
    imageIndex?: number;
    nextImage?: () => void;
    previousImage?: () => void;
    showShare?: boolean;
  }) => {
    const available = isAvailable(row.status);
    if (available === null) {
      return null;
    }

    const selectedImage = row.imageLinks[imageIndex];
    const itemUrl = `${window.location.origin}${window.location.pathname}#item-${row.id}`;

    return (
      <Card
        id={`item-${row.id}`}
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
          bg={`${theme.primaryColor}.1`}
          onClick={(e) => {
            e.preventDefault();
            if (setDialog && available) setDialog(row.id);
          }}
          style={{
            cursor: setDialog && available ? "pointer" : "default",
            outlineColor: "var(--mantine-primary-color-9)",
          }}
        >
          <Image
            src={urlJoin(publicPath, selectedImage)}
            alt={row.title}
            mah={selected ? "65vh" : 300}
            fit="contain"
          />
        </Card.Section>
        <Stack justify="space-between" flex={1} gap="lg">
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
              <ShowCategory category={row.category} />
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
          <Group justify="space-between" align="flex-end" wrap="nowrap">
            <ShowPrice value={row.value} perUnit={row.perUnit} />
            <Group justify="flex-end" align="center" gap={6}>
              {showShare ? (
                navigator.share ? (
                  <Button
                    title="compartilhar"
                    className="print-hide"
                    leftSection={<ShareIcon size={20} />}
                    size="sm"
                    disabled={!available}
                    onClick={() => {
                      navigator
                        .share({
                          title: row.title,
                          text: `Confira este item à venda: ${row.title} (código ${row.id})`,
                          url: itemUrl,
                        })
                        .catch((error) => {
                          console.error("Erro ao compartilhar:", error);
                        });
                    }}
                  >
                    compartilhar
                  </Button>
                ) : (
                  <CopyButton value={itemUrl} timeout={2000}>
                    {({ copied, copy }) => (
                      <Button
                        title="compartilhar"
                        className="print-hide"
                        variant={copied ? "outline" : undefined}
                        leftSection={
                          copied ? (
                            <CopyIcon size={20} />
                          ) : (
                            <ShareIcon size={20} />
                          )
                        }
                        size="sm"
                        disabled={!available}
                        onClick={copy}
                      >
                        {copied ? "copiado" : "compartilhar"}
                      </Button>
                    )}
                  </CopyButton>
                )
              ) : null}
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
          </Group>
        </Stack>
        {row.imageLinks.length > 1 ? (
          <Badge
            variant="outline"
            className="top-left print-hide"
            bg={`${theme.primaryColor}.1`}
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
            bg={alpha("var(--mantine-primary-color-1)", 0.4)}
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
            bg={alpha("var(--mantine-primary-color-1)", 0.4)}
          >
            <ArrowCircleRightIcon size={36} />
          </ActionIcon>
        ) : null}
      </Card>
    );
  },
);

const Items = memo(({ rows }: { rows: Row[] }) => {
  const fragmentId = useMemo(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#item-")) {
      const id = parseInt(hash.slice(6), 10);
      return Number.isNaN(id) ? null : id;
    }
    return null;
  }, []);

  const [dialogId, setDialogId] = useState<number | null>(fragmentId);
  const [imageIndex, setImageIndex] = useState(0);
  const showDialog = true;
  const selectedRow = useMemo(
    () => rows.find((r) => r.id === dialogId) || null,
    [dialogId, rows],
  );

  const setDialog = useCallback((id: number | null) => {
    setDialogId(id);
    setImageIndex(0);
    if (id !== null) {
      history.replaceState(null, "", `#item-${id}`);
    } else {
      history.replaceState(null, "", window.location.pathname);
    }
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
    return (
      <Text c="gray" mx="auto" display="block">
        Nenhum item encontrado
      </Text>
    );
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
      <ItemCardModal
        row={selectedRow}
        dialogId={dialogId}
        setDialog={setDialog}
        imageIndex={imageIndex}
        nextImage={
          selectedRow && imageIndex < selectedRow.imageLinks.length - 1
            ? nextImage
            : undefined
        }
        previousImage={
          selectedRow && imageIndex > 0 ? previousImage : undefined
        }
      />
    </>
  );
});

export default Items;
