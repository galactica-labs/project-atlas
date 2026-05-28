import { useCommandCenterStore } from "./commandCenterStore";

export function SceneLighting() {
  const viewMode = useCommandCenterStore((s) => s.viewMode);
  const isIncident = viewMode === "incident";

  return (
    <>
      {/* Ambient — slightly cool industrial */}
      <ambientLight
        intensity={isIncident ? 0.28 : 0.38}
        color={isIncident ? "#c0c8cc" : "#c8d4e0"}
      />

      {/* Key directional — overhead, slightly front-right */}
      <directionalLight
        position={[10, 22, 10]}
        intensity={isIncident ? 0.85 : 1.1}
        color="#dce8f0"
        castShadow={false}
      />

      {/* Fill light — left rear */}
      <directionalLight position={[-12, 14, -8]} intensity={0.3} color="#a0b4cc" />

      {/* Ceiling area light simulation — soft top-down */}
      <pointLight
        position={[-2, 10, 0]}
        intensity={0.35}
        color="#ddeeff"
        decay={1.5}
        distance={35}
      />
      <pointLight
        position={[8, 10, 0]}
        intensity={0.25}
        color="#ddeeff"
        decay={1.5}
        distance={28}
      />

      {/* Cooling zone accent — subtle cyan tint */}
      <pointLight position={[12, 5, 0]} intensity={0.18} color="#22d3ee" decay={2} distance={10} />

      {/* Electrical zone accent — subtle amber */}
      <pointLight position={[-13, 4, 0]} intensity={0.14} color="#f59e0b" decay={2} distance={8} />

      {/* Incident dramatic underlighting */}
      {isIncident && (
        <pointLight
          position={[-5, 1, -3.5]}
          intensity={0.55}
          color="#ff3300"
          decay={2}
          distance={14}
        />
      )}
    </>
  );
}
