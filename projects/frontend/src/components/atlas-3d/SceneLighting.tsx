export function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.35} color="#c8d4e0" />
      <directionalLight position={[12, 20, 8]} intensity={1.1} color="#e8edf2" castShadow={false} />
      <directionalLight position={[-10, 15, -10]} intensity={0.4} color="#a0b4cc" />
      <pointLight position={[0, 8, 0]} intensity={0.2} color="#ffffff" decay={2} distance={30} />
    </>
  );
}
