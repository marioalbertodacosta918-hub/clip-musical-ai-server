import RunwayML, { TaskFailedError } from "@runwayml/sdk";

const client = new RunwayML({
  apiKey: process.env.RUNWAYML_API_SECRET
});

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método não permitido"
    });
  }

  try {

    const {
      roteiro,
      formato = "16:9"
    } = req.body || {};

    if (!roteiro) {
      return res.status(400).json({
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
Crie uma cena cinematográfica para um clipe musical cristão.

Roteiro:
${roteiro}

Estilo visual:
cinematográfico, emocionante, realista, iluminação dramática,
movimentos de câmera suaves, composição profissional,
atmosfera bíblica e épica.

Não adicionar textos, legendas ou marcas d'água.
`;

    const task = await client.imageToVideo
      .create({
        model: "gen4.5",
        promptText: prompt,
        ratio: ratio,
        duration: 5
      })
      .waitForTaskOutput();

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
