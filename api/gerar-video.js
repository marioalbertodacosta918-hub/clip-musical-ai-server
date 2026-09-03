import RunwayML, { TaskFailedError } from "@runwayml/sdk";

const client = new RunwayML({
  apiKey: process.env.RUNWAYML_API_SECRET
});

export default async function handler(req, res) {

  // CORS
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

  // Preflight
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // Somente POST
  if (req.method !== "POST") {
    return res.status(405).json({
      sucesso: false,
      error: "Método não permitido"
    });
  }

  try {

    const {
      roteiro,
      formato = "16:9"
    } = req.body || {};

    if (
      !roteiro ||
      typeof roteiro !== "string" ||
      roteiro.trim() === ""
    ) {
      return res.status(400).json({
        sucesso: false,
        error: "O roteiro não foi informado."
      });
    }

    let ratio = "1280:720";

    if (formato === "9:16") {
      ratio = "720:1280";
    }

    // Gen-4.5 não aceita 1:1 em texto para vídeo.
    // Nesse caso usamos 16:9.
    if (formato === "1:1") {
      ratio = "1280:720";
    }

    const prompt = `
Crie um vídeo cinematográfico para um clipe musical cristão.

ROTEIRO:
${roteiro}

ESTILO:
Cinematográfico, emocionante, realista, épico,
iluminação dramática, movimentos de câmera suaves,
composição profissional e atmosfera bíblica.

IMPORTANTE:
Não adicionar textos na imagem.
Não adicionar legendas.
Não adicionar marcas d'água.
`;

    console.log("Iniciando geração do vídeo...");
    console.log("Formato:", formato);
    console.log("Ratio:", ratio);

    /*
     * GEN-4.5
     * Texto para vídeo.
     *
     * IMPORTANTE:
     * Não enviar promptImage.
     */

    const task = await client.imageToVideo
      .create({
        model: "gen4.5",
        promptText: prompt,
        ratio: ratio,
        duration: 5
      })
      .waitForTaskOutput();

    console.log("Resposta do Runway:", task);

    if (!task.output || !task.output[0]) {
      return res.status(500).json({
        sucesso: false,
        error: "O Runway não retornou o vídeo."
      });
    }

    return res.status(200).json({
      sucesso: true,
      videoUrl: task.output[0]
    });

  } catch (error) {

    console.error("Erro Runway:", error);

    if (error instanceof TaskFailedError) {

      return res.status(500).json({
        sucesso: false,
        error: "O Runway não conseguiu gerar o vídeo.",
        detalhes: error.taskDetails || null
      });

    }

    return res.status(500).json({
      sucesso: false,
      error: error.message || "Erro interno ao gerar o vídeo."
    });
  }
}
