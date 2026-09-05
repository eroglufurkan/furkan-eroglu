import { ImageResponse } from "next/og";
import { PROFILE } from "@/content/portfolio";

export const alt = `${PROFILE.name} — ${PROFILE.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The share card. The room is drawn on a canvas at runtime and satori cannot
 * run canvas, so this rebuilds a slice of it out of plain boxes — same palette,
 * same furniture, enough that the card and the site read as one thing.
 */
export default function OpengraphImage() {
  const C = {
    page: "#fdf4e3",
    ink: "#2f2418",
    dim: "#63513a",
    faint: "#8a7658",
    ember: "#c2410c",
    floor: "#cdbb9a",
    floorAlt: "#d9c8a8",
    grout: "#a48e6c",
    wall: "#efdcb8",
    trim: "#a8794a",
    wood: "#cf9350",
    woodDark: "#96602c",
    screen: "#2f9fd8",
    rug: "#37a89b",
    rugEdge: "#6fd8c8",
    coat: "#4185d6",
    coatDark: "#2e63a6",
    scarf: "#e8543f",
    outline: "#59422a",
    pot: "#c96f42",
    leaf: "#3f9a4a",
    ball: "#e0453c",
  };

  /** One piece of furniture: an outlined block with an optional top highlight. */
  const Block = (props: {
    left: number;
    top: number;
    width: number;
    height: number;
    fill: string;
    top1?: string;
  }) => (
    <div
      style={{
        position: "absolute",
        left: props.left,
        top: props.top,
        width: props.width,
        height: props.height,
        background: props.fill,
        border: `2px solid ${C.outline}`,
        display: "flex",
      }}
    >
      {props.top1 ? (
        <div style={{ width: "100%", height: 4, background: props.top1 }} />
      ) : null}
    </div>
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: C.page,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 64px 0",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 92,
              fontWeight: 700,
              color: C.ink,
              letterSpacing: -2,
              lineHeight: 1,
            }}
          >
            {PROFILE.name}
          </div>
          <div
            style={{
              marginTop: 20,
              fontSize: 27,
              color: C.dim,
              letterSpacing: 9,
              textTransform: "uppercase",
            }}
          >
            {PROFILE.role}
          </div>
          <div
            style={{
              marginTop: 26,
              width: 96,
              height: 4,
              background: C.ember,
              display: "flex",
            }}
          />
          <div style={{ marginTop: 26, fontSize: 26, color: C.faint }}>
            A portfolio you can walk around.
          </div>
        </div>

        {/* A slice of the room, rebuilt in boxes. */}
        <div
          style={{
            position: "relative",
            width: 1072,
            height: 208,
            display: "flex",
            background: C.floor,
            borderTop: `3px solid ${C.outline}`,
            borderLeft: `3px solid ${C.outline}`,
            borderRight: `3px solid ${C.outline}`,
            overflow: "hidden",
          }}
        >
          {/* floor slabs */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: i * 134,
                top: 46,
                width: 134,
                height: 162,
                background: i % 2 === 0 ? C.floorAlt : C.floor,
                borderRight: `2px solid ${C.grout}`,
                display: "flex",
              }}
            />
          ))}

          {/* back wall and its trim */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 1072,
              height: 46,
              background: C.wall,
              borderBottom: `4px solid ${C.trim}`,
              display: "flex",
            }}
          />

          {/* laptop desk */}
          <Block left={78} top={44} width={168} height={44} fill={C.wood} top1={C.woodDark} />
          <Block left={130} top={22} width={62} height={26} fill={C.screen} />

          {/* dev station */}
          <Block left={800} top={44} width={176} height={44} fill={C.wood} top1={C.woodDark} />
          <Block left={846} top={14} width={88} height={38} fill={C.screen} />

          {/* rug */}
          <div
            style={{
              position: "absolute",
              left: 404,
              top: 92,
              width: 236,
              height: 100,
              background: C.rug,
              border: `4px solid ${C.rugEdge}`,
              display: "flex",
            }}
          />

          {/* the character, standing on the rug */}
          <div
            style={{
              position: "absolute",
              left: 498,
              top: 100,
              width: 44,
              height: 82,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                background: C.coat,
                border: `3px solid ${C.outline}`,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 10,
                  marginBottom: 4,
                  background: "#141a28",
                  display: "flex",
                }}
              />
            </div>
            <div style={{ width: 38, height: 8, background: C.scarf, display: "flex" }} />
            <div
              style={{
                width: 44,
                height: 34,
                background: C.coatDark,
                border: `3px solid ${C.outline}`,
                display: "flex",
              }}
            />
          </div>

          {/* ball */}
          <div
            style={{
              position: "absolute",
              left: 690,
              top: 140,
              width: 34,
              height: 34,
              borderRadius: 34,
              background: C.ball,
              border: `3px solid ${C.outline}`,
              display: "flex",
            }}
          />

          {/* a plant in its pot */}
          <div
            style={{
              position: "absolute",
              left: 262,
              top: 118,
              width: 58,
              height: 74,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div style={{ width: 32, height: 11, background: "#6fd06a", display: "flex" }} />
            <div style={{ width: 52, height: 11, background: C.leaf, display: "flex" }} />
            <div
              style={{
                width: 40,
                height: 44,
                marginTop: 3,
                background: C.pot,
                border: `3px solid ${C.outline}`,
                display: "flex",
              }}
            />
          </div>
        </div>
      </div>
    ),
    size,
  );
}
