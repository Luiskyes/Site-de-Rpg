"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const userRes = await fetch("/api/auth/me");

        if (!userRes.ok) {
          router.push("/login");
          return;
        }

        const userData = await userRes.json();
        setUser(userData);

        const charRes = await fetch("/api/characters/me");

        if (charRes.ok) {
          const char = await charRes.json();
          setCharacter(char);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <main style={styles.loading}>
        Carregando...
      </main>
    );
  }

  const hasCharacter = !!character;

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        <header style={styles.header}>
          <button onClick={logout} style={styles.logout}>
            Sair da conta
          </button>
        </header>

        <section style={styles.hero}>
          <div>
            <p style={styles.tag}>Sistema RPG</p>

            <h1 style={styles.title}>
              Bem-vindo {user?.email}
            </h1>

            <p style={styles.subtitle}>
              Gerencie seu personagem e acompanhe sua evolução.
            </p>
          </div>

          <div style={styles.heroStatus}>
            <span style={styles.statusLabel}>
              Status da ficha
            </span>

            <strong style={styles.statusValue}>
              {hasCharacter ? "Ficha criada" : "Sem ficha"}
            </strong>

            {hasCharacter && (
              <small style={styles.statusMeta}>
                {character.name} • {character.class}
              </small>
            )}
          </div>
        </section>

        <section style={styles.actions}>

          {hasCharacter ? (

            <Link
              href={`/characters/${character.id}`}
              style={styles.primaryCard}
            >
              <div>
                <p style={styles.cardTag}>Jogador</p>

                <h2 style={styles.cardTitle}>
                  Ver Jogador
                </h2>

                <p style={styles.cardText}>
                  Visualize sua ficha completa com atributos e perícias.
                </p>
              </div>

              <span style={styles.arrow}>→</span>
            </Link>

          ) : (

            <Link
              href="/characters/create"
              style={styles.primaryCard}
            >
              <div>
                <p style={styles.cardTag}>Criação</p>

                <h2 style={styles.cardTitle}>
                  Criar Ficha
                </h2>

                <p style={styles.cardText}>
                  Escolha uma classe e distribua seus pontos iniciais.
                </p>
              </div>

              <span style={styles.arrow}>→</span>
            </Link>

          )}

        </section>

      </div>
    </main>
  );
}

const styles = {

page:{
minHeight:"100vh",
background:"radial-gradient(circle at top, rgba(37,99,235,0.18), transparent 30%), #0b1120",
color:"#f8fafc",
padding:"24px"
},

container:{
maxWidth:"1200px",
margin:"0 auto",
display:"flex",
flexDirection:"column",
gap:"20px"
},

loading:{
minHeight:"100vh",
display:"flex",
alignItems:"center",
justifyContent:"center",
background:"#0b1120",
color:"#fff"
},

header:{
display:"flex",
justifyContent:"flex-start"
},

logout:{
background:"#dc2626",
border:"none",
padding:"12px 16px",
borderRadius:"12px",
color:"#fff",
fontWeight:"bold",
cursor:"pointer"
},

hero:{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
background:"linear-gradient(135deg,#111827,#172033)",
borderRadius:"20px",
padding:"28px"
},

tag:{
color:"#93c5fd",
fontSize:"14px",
margin:0
},

title:{
fontSize:"40px",
margin:"6px 0"
},

subtitle:{
color:"#cbd5e1"
},

heroStatus:{
background:"rgba(255,255,255,0.05)",
padding:"18px",
borderRadius:"14px",
display:"flex",
flexDirection:"column",
gap:"4px"
},

statusLabel:{
fontSize:"12px",
color:"#94a3b8"
},

statusValue:{
fontSize:"20px"
},

statusMeta:{
color:"#cbd5e1"
},

actions:{
display:"grid",
gridTemplateColumns:"1fr",
gap:"16px"
},

primaryCard:{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
background:"linear-gradient(135deg,#2563eb,#1d4ed8)",
borderRadius:"20px",
padding:"28px",
textDecoration:"none",
color:"#fff"
},

cardTag:{
fontSize:"12px",
opacity:0.8
},

cardTitle:{
fontSize:"30px",
margin:"4px 0"
},

cardText:{
maxWidth:"400px",
opacity:0.9
},

arrow:{
fontSize:"42px"
}

}