export default function NotFound() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#060c18",
      color: "#fff",
      flexDirection: "column",
      gap: 20
    }}>
      <h1 style={{fontSize: 48}}>404</h1>
      <p>Página não encontrada</p>
    </div>
  );
}