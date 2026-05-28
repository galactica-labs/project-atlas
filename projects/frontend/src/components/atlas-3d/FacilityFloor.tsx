import { Html } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

const FLOOR_W = 32;
const FLOOR_D = 22;

// ── Zone tint overlays ──────────────────────────────────────────────
// Each tint is rendered as a thin plane slightly above the base floor
const ZONE_TINTS = [
  // Cold aisle — between Row C (maxZ=-2) and Row D (minZ=2)
  { cx: -5, cz: 0, w: 14, d: 4, color: "#083344", opacity: 0.22, label: null },
  // Hot aisle behind Row C (south of racks)
  { cx: -5, cz: -6.5, w: 14, d: 3, color: "#3d1200", opacity: 0.1, label: null },
  // Hot aisle behind Row D (north of racks)
  { cx: -5, cz: 6.5, w: 14, d: 3, color: "#3d1200", opacity: 0.1, label: null },
  // Cooling zone floor (east wall)
  { cx: 11.5, cz: 0, w: 5, d: 12, color: "#0c4a6e", opacity: 0.2, label: "COOLING" },
  // Electrical zone floor (west wall)
  { cx: -12.5, cz: 0, w: 5, d: 12, color: "#451a03", opacity: 0.2, label: "ELECTRICAL" },
  // Network zone floor (south corridor)
  { cx: 0, cz: -8.25, w: 10, d: 3.5, color: "#2e1065", opacity: 0.2, label: "NETWORK" },
  // Service corridor (east of racks, between data rows and cooling zone)
  { cx: 6, cz: 0, w: 5.5, d: 12, color: "#161616", opacity: 0.06, label: "CORRIDOR" },
];

// ── Aisle boundary lines ────────────────────────────────────────────
// Dashed lines marking cold aisle edges
const AISLE_LINES: Array<{ pts: [number, number, number][]; color: string; opacity: number }> = [
  // Cold aisle north edge (z = -2)
  {
    pts: [
      [-12, 0.012, -2],
      [2, 0.012, -2],
    ],
    color: "#22d3ee",
    opacity: 0.25,
  },
  // Cold aisle south edge (z = 2)
  {
    pts: [
      [-12, 0.012, 2],
      [2, 0.012, 2],
    ],
    color: "#22d3ee",
    opacity: 0.25,
  },
];

// ── Airflow arrows in cold aisle ────────────────────────────────────
// Arrows show cold air flowing from CRAC units (east, x≈9) toward racks (west, x≈-10)
const AIRFLOW_ARROW_XS = [7.5, 4.5, 1.5, -1.5, -4.5, -7.5];
const AIRFLOW_ARROW_ZS = [-0.9, 0.9]; // two rows of arrows in the cold aisle

function buildArrowGeometry(): THREE.BufferGeometry {
  // Flat triangle pointing in -x direction (airflow west toward racks)
  const pts = [
    new THREE.Vector3(-0.45, 0, 0), // tip
    new THREE.Vector3(0.2, 0, -0.22), // back right
    new THREE.Vector3(0.2, 0, 0.22), // back left
  ];
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  geo.setIndex([0, 2, 1]);
  geo.computeVertexNormals();
  return geo;
}

function GridLines({ showGrid }: { showGrid: boolean }) {
  const geometry = useMemo(() => {
    const pts: number[] = [];
    const hw = FLOOR_W / 2;
    const hd = FLOOR_D / 2;
    const step = 1;
    for (let x = -hw; x <= hw; x += step) {
      pts.push(x, 0.006, -hd, x, 0.006, hd);
    }
    for (let z = -hd; z <= hd; z += step) {
      pts.push(-hw, 0.006, z, hw, 0.006, z);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return geo;
  }, []);

  if (!showGrid) return null;

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#ffffff" transparent opacity={0.03} />
    </lineSegments>
  );
}

// ── Floor border accent ─────────────────────────────────────────────
const FLOOR_BORDER_HW = FLOOR_W / 2 + 0.1;
const FLOOR_BORDER_HD = FLOOR_D / 2 + 0.1;
const FLOOR_BORDER_PTS: [number, number, number][] = [
  [-FLOOR_BORDER_HW, 0.008, -FLOOR_BORDER_HD],
  [FLOOR_BORDER_HW, 0.008, -FLOOR_BORDER_HD],
  [FLOOR_BORDER_HW, 0.008, FLOOR_BORDER_HD],
  [-FLOOR_BORDER_HW, 0.008, FLOOR_BORDER_HD],
  [-FLOOR_BORDER_HW, 0.008, -FLOOR_BORDER_HD],
];

function FloorBorder() {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(FLOOR_BORDER_PTS.flat(), 3));
    return g;
  }, []);

  return (
    <primitive
      object={
        new THREE.Line(
          geo,
          new THREE.LineBasicMaterial({ color: "#2a2a2a", opacity: 0.5, transparent: true })
        )
      }
    />
  );
}

// ── Raised floor tile accents ───────────────────────────────────────
// Draw a coarser 2m tile grid to simulate raised-floor panels
function RaisedTileGrid() {
  const geometry = useMemo(() => {
    const pts: number[] = [];
    const hw = FLOOR_W / 2;
    const hd = FLOOR_D / 2;
    const step = 2;
    for (let x = -hw; x <= hw; x += step) {
      pts.push(x, 0.004, -hd, x, 0.004, hd);
    }
    for (let z = -hd; z <= hd; z += step) {
      pts.push(-hw, 0.004, z, hw, 0.004, z);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return geo;
  }, []);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#ffffff" transparent opacity={0.055} />
    </lineSegments>
  );
}

export function FacilityFloor({ showGrid }: { showGrid: boolean }) {
  const arrowGeo = useMemo(() => buildArrowGeometry(), []);

  const aisleLineObjects = useMemo(
    () =>
      AISLE_LINES.map(({ pts, color, opacity }) => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.Float32BufferAttribute(pts.flat(), 3));
        const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
        return new THREE.Line(geo, mat);
      }),
    []
  );

  return (
    <group>
      {/* ── Base floor slab ──────────────────────────────────────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[FLOOR_W, FLOOR_D]} />
        <meshStandardMaterial color="#070707" roughness={0.97} metalness={0.02} />
      </mesh>

      {/* Subtle floor border shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <planeGeometry args={[FLOOR_W + 0.8, FLOOR_D + 0.8]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <planeGeometry args={[FLOOR_W, FLOOR_D]} />
        <meshStandardMaterial color="#070707" roughness={0.97} metalness={0.02} />
      </mesh>

      {/* ── Raised tile grid ─────────────────────────────────────── */}
      <RaisedTileGrid />

      {/* ── Fine grid ────────────────────────────────────────────── */}
      {showGrid && <GridLines showGrid={showGrid} />}

      {/* ── Zone tint overlays ───────────────────────────────────── */}
      {ZONE_TINTS.map((tint) => (
        <group key={`tint-${tint.cx}-${tint.cz}`}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[tint.cx, 0.009, tint.cz]}>
            <planeGeometry args={[tint.w, tint.d]} />
            <meshBasicMaterial
              color={tint.color}
              transparent
              opacity={tint.opacity}
              depthWrite={false}
            />
          </mesh>
          {tint.label && (
            <Html
              position={[tint.cx, 0.05, tint.cz]}
              center
              distanceFactor={22}
              occlude={false}
              style={{ pointerEvents: "none" }}
            >
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "8px",
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color:
                    tint.color === "#083344"
                      ? "#22d3ee"
                      : tint.color === "#451a03"
                        ? "#f59e0b"
                        : tint.color === "#2e1065"
                          ? "#a855f7"
                          : "#555555",
                  opacity: 0.55,
                  whiteSpace: "nowrap",
                }}
              >
                {tint.label}
              </span>
            </Html>
          )}
        </group>
      ))}

      {/* ── Cold aisle label ─────────────────────────────────────── */}
      <Html
        position={[-5, 0.05, 0]}
        center
        distanceFactor={22}
        occlude={false}
        style={{ pointerEvents: "none" }}
      >
        <span
          style={{
            fontFamily: "monospace",
            fontSize: "7px",
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#22d3ee",
            opacity: 0.45,
            whiteSpace: "nowrap",
          }}
        >
          ← COLD AISLE →
        </span>
      </Html>

      {/* ── Aisle boundary lines ─────────────────────────────────── */}
      {aisleLineObjects.map((obj) => (
        <primitive key={obj.uuid} object={obj} />
      ))}

      {/* ── Airflow arrows ───────────────────────────────────────── */}
      {AIRFLOW_ARROW_XS.map((ax) =>
        AIRFLOW_ARROW_ZS.map((az) => (
          <mesh
            key={`arrow-${ax}-${az}`}
            geometry={arrowGeo}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[ax, 0.014, az]}
          >
            <meshBasicMaterial
              color="#22d3ee"
              transparent
              opacity={0.2}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        ))
      )}

      {/* ── Floor border accent ──────────────────────────────────── */}
      <FloorBorder />
    </group>
  );
}
