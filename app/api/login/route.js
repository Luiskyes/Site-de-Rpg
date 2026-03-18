// app/api/login/route.js

// Importa utilidades do Next.js para respostas HTTP
import { NextResponse } from "next/server";

// Biblioteca para comparar senha com hash
import bcrypt from "bcryptjs";

// Conexão com o banco PostgreSQL
import { pool } from "../../../lib/db";

// Função que cria o token JWT da sessão
import { createSessionToken } from "../../../lib/auth";

// Garante execução no runtime Node.js
export const runtime = "nodejs";

/**
 * Rota responsável por autenticar usuários.
 * Endpoint: POST /api/login
 */
export async function POST(req) {
  try {
    // Lê o corpo da requisição
    const { email, password } = await req.json();

    // Validação básica
    if (!email || !password) {
      return NextResponse.json(
        { error: "E-mail e senha são obrigatórios" },
        { status: 400 }
      );
    }

    // Busca usuário pelo e-mail
    const result = await pool.query(
      'SELECT id, email, "passwordHash" FROM users WHERE email = $1',
      [email]
    );

    // Se não encontrou usuário, retorna erro de autenticação
    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "E-mail ou senha inválidos" },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // Compara a senha enviada com o hash salvo no banco
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "E-mail ou senha inválidos" },
        { status: 401 }
      );
    }

    // Gera token de sessão
    const token = await createSessionToken(user.id);

    // Monta resposta sem expor o hash
    const response = NextResponse.json(
      {
        id: user.id,
        email: user.email,
      },
      { status: 200 }
    );

    // Salva token no cookie
    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("LOGIN ERROR:", err);

    return NextResponse.json(
      {
        error: "Erro ao fazer login",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}