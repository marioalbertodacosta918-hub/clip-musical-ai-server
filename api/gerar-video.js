import RunwayML, { TaskFailedError } from "@runwayml/sdk";

const client = new RunwayML({
  apiKey: process.env.RUNWAYML_API_SECRET
});

export default async function handler(req, res) {

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

    if (!roteiro || roteiro.trim() === "") {
      return res.status(400).json({
        sucesso: false,
        error: "O roteiro não foi informado."
      });
    }

    let ratio = "1280:720";

    if (formato === "9:16") {
      ratio = "720:1280";
    }

    if (formato === "1:1") {
      ratio = "960:960";
    }

    const prompt = `
Crie um vídeo cinematográfico para um clipe musical cristão.

ROTEIRO:
${roteiro}

ESTILO:
Cinematográfico, emocionante, realista, épico,
iluminação dramática, movimentos de câmera suaves,
composição profissional, atmosfera bíblica.

IMPORTANTE:
Não adicionar textos na imagem.
Não adicionar legendas.
Não adicionar marcas d'água.
`;

    /*
     * Geração de vídeo a partir de texto.
     */

    const task = await client.textToVideo
      .create({
        model: "gen4.5",
        promptText: prompt,
        ratio: ratio,
        duration: 5
      })
      .waitForTaskOutput();

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
        detalhes: error.taskDetails
      });

    }

    return res.status(500).json({
      sucesso: false,
      error: error.message || "Erro interno ao gerar o vídeo."
    });

  }

}
