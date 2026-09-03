import RunwayML, { TaskFailedError } from "@runwayml/sdk";

const client = new RunwayML({
  apiKey: process.env.RUNWAYML_API_SECRET
});

export default async function handler(req, res) {

  // ==============================
  // CORS
  // ==============================

  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://marioalbertodacosta918-hub.github.io"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  // ==============================
  // OPTIONS
  // ==============================

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // ==============================
  // SOMENTE POST
  // ==============================

  if (req.method !== "POST") {
    return res.status(405).json({
      sucesso: false,
      error: "Método não permitido"
    });
  }

  try {

    // ==============================
    // VERIFICAR API KEY
    // ==============================

    if (!process.env.RUNWAYML_API_SECRET) {
      return res.status(500).json({
        sucesso: false,
        error: "RUNWAYML_API_SECRET não está configurada na Vercel."
      });
    }

    // ==============================
    // RECEBER DADOS
    // ==============================

    const body = req.body || {};

    console.log("=================================");
    console.log("BODY RECEBIDO:");
    console.log(body);
    console.log("=================================");

    const roteiro =
      typeof body.roteiro === "string"
        ? body.roteiro.trim()
        : "";

    const formato =
      typeof body.formato === "string"
        ? body.formato
        : "16:9";

    const imagem =
      typeof body.imagem === "string"
        ? body.imagem.trim()
        : "";

    // ==============================
    // VALIDAR ROTEIRO
    // ==============================

    if (!roteiro) {
      return res.status(400).json({
        sucesso: false,
        error: "O roteiro não foi informado."
      });
    }

    // ==============================
    // VALIDAR IMAGEM
    // ==============================

    if (!imagem) {
      return res.status(400).json({
        sucesso: false,
        error: "Nenhuma imagem foi enviada para gerar a cena."
      });
    }

    // ==============================
    // DEFINIR FORMATO
    // ==============================

    let ratio;

    if (formato === "9:16") {
  ratio = "720:1280";
} else {
  ratio = "1280:720";
}

    // ==============================
    // PROMPT
    // ==============================

    const promptText = `
Crie uma cena cinematográfica para um clipe musical cristão.

Use a imagem fornecida como imagem inicial da cena.

ROTEIRO DA CENA:
${roteiro}

DIREÇÃO VISUAL:

Cinematográfico.
Realista.
Emocionante.
Épico.
Iluminação dramática.
Movimentos de câmera suaves e profissionais.
Atmosfera de fé, esperança e superação.
Cenários naturais e grandiosos.
Fotografia cinematográfica.
Profundidade de campo cinematográfica.
Movimento natural dos personagens e elementos da cena.

IMPORTANTE:

Não adicionar textos.
Não adicionar legendas.
Não adicionar letras de música.
Não adicionar logotipos.
Não adicionar marcas d'água.
Não modificar desnecessariamente os personagens presentes na imagem.
Preservar a identidade visual da imagem original.
Criar movimento cinematográfico natural a partir da imagem.
`;

    console.log("=================================");
    console.log("ENVIANDO PARA RUNWAY");
    console.log("Modelo: gen4.5");
    console.log("Ratio:", ratio);
    console.log("Duração: 5 segundos");
    console.log("Imagem recebida: SIM");
    console.log("=================================");

    // ==============================
    // GERAR VÍDEO
    // ==============================

    const task = await client.imageToVideo.create({
      model: "gen4.5",
      promptImage: imagem,
      promptText: promptText,
      ratio: ratio,
      duration: 5
    });

    console.log("TAREFA RUNWAY CRIADA:");
    console.log(task);

    // ==============================
    // AGUARDAR RESULTADO
    // ==============================

    const resultado = await task.waitForTaskOutput();

    console.log("=================================");
    console.log("RESULTADO RUNWAY:");
    console.log(resultado);
    console.log("=================================");

    // ==============================
    // VALIDAR RESULTADO
    // ==============================

    if (
      !resultado ||
      !resultado.output ||
      !Array.isArray(resultado.output) ||
      !resultado.output[0]
    ) {
      return res.status(500).json({
        sucesso: false,
        error: "O Runway terminou a tarefa, mas não retornou o vídeo.",
        detalhes: resultado || null
      });
    }

    // ==============================
    // SUCESSO
    // ==============================

    return res.status(200).json({
      sucesso: true,
      videoUrl: resultado.output[0]
    });

  } catch (error) {

    console.error("=================================");
    console.error("ERRO COMPLETO RUNWAY:");
    console.error(error);
    console.error("=================================");

    // ==============================
    // ERRO DA TAREFA RUNWAY
    // ==============================

    if (error instanceof TaskFailedError) {

      return res.status(500).json({
        sucesso: false,
        error: "A geração do vídeo falhou na Runway.",
        detalhes: error.taskDetails || null
      });
    }

    // ==============================
    // ERRO GERAL
    // ==============================

    return res.status(500).json({
      sucesso: false,
      error: error?.message || "Erro interno ao gerar o vídeo."
    });
  }
}
