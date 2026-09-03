import RunwayML, { TaskFailedError } from "@runwayml/sdk";

const client = new RunwayML({
  apiKey: process.env.RUNWAYML_API_SECRET
});

export default async function handler(req, res) {

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

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      sucesso: false,
      error: "Método não permitido"
    });
  }

  try {

    const body = req.body || {};

    console.log("BODY RECEBIDO:", body);

    const roteiro =
      typeof body.roteiro === "string"
        ? body.roteiro.trim()
        : "";

    const formato =
      typeof body.formato === "string"
        ? body.formato
        : "16:9";

    if (!roteiro) {
      return res.status(400).json({
        sucesso: false,
        error: "O roteiro não foi informado."
      });
    }

    if (!process.env.RUNWAYML_API_SECRET) {
      return res.status(500).json({
        sucesso: false,
        error: "RUNWAYML_API_SECRET não está configurada na Vercel."
      });
    }

    let ratio;

    if (formato === "9:16") {
      ratio = "720:1280";
    } else {
      ratio = "1280:720";
    }

    const promptText = `
Crie um vídeo cinematográfico para um clipe musical cristão.

ROTEIRO:
${roteiro}

DIREÇÃO VISUAL:
Cinematográfico, realista, emocionante e épico.
Iluminação dramática.
Movimentos de câmera suaves e profissionais.
Atmosfera de fé, esperança e superação.
Cenários naturais e grandiosos.
Fotografia cinematográfica.

IMPORTANTE:
Não adicionar textos.
Não adicionar legendas.
Não adicionar letras de música.
Não adicionar marcas d'água.
`;

    console.log("ENVIANDO PARA RUNWAY:");
    console.log("Modelo: gen4.5");
    console.log("Ratio:", ratio);
    console.log("Duração: 5 segundos");

    const task = await client.imageToVideo.create({
      model: "gen4.5",
      promptText: promptText,
      ratio: ratio,
      duration: 5
    });

    console.log("TAREFA CRIADA:", task);

    const resultado = await task.waitForTaskOutput();

    console.log("RESULTADO RUNWAY:", resultado);

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

    return res.status(200).json({
      sucesso: true,
      videoUrl: resultado.output[0]
    });

  } catch (error) {

    console.error("ERRO COMPLETO RUNWAY:", error);

    if (error instanceof TaskFailedError) {
      return res.status(500).json({
        sucesso: false,
        error: "A geração do vídeo falhou na Runway.",
        detalhes: error.taskDetails || null
      });
    }

    return res.status(500).json({
      sucesso: false,
      error: error?.message || "Erro interno ao gerar o vídeo."
    });
  }
}
  
