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
    // LIMPAR E LIMITAR ROTEIRO
    // ==============================

    /*
      A Runway aceita no máximo 1000 caracteres
      no campo promptText.

      Reservamos espaço para a direção visual
      e usamos apenas a parte relevante do roteiro.
    */

    const roteiroLimpo = roteiro
      .replace(/\s+/g, " ")
      .trim();

    // ==============================
    // DIREÇÃO VISUAL CURTA
    // ==============================

    const direcaoVisual = `
Cena cinematográfica para clipe musical cristão.
Realista, emocionante e épica.
Iluminação dramática.
Movimento de câmera suave e profissional.
Atmosfera de fé, esperança e superação.
Movimento natural dos personagens e elementos.
Preservar a identidade visual da imagem original.
Não adicionar textos, legendas, letras, logotipos ou marcas d'água.
`;

    // ==============================
    // LIMITE DO PROMPT
    // ==============================

    const limitePrompt = 1000;

    /*
      Criamos primeiro a parte fixa.
    */

    const textoBase =
      "Crie uma cena cinematográfica usando a imagem fornecida como imagem inicial.\n\n" +
      direcaoVisual +
      "\nDescrição da cena:\n";

    /*
      Calculamos quanto espaço sobra para o roteiro.
    */

    const espacoDisponivel =
      limitePrompt - textoBase.length;

    let roteiroParaCena = roteiroLimpo;

    if (roteiroParaCena.length > espacoDisponivel) {
      roteiroParaCena =
        roteiroParaCena.substring(0, espacoDisponivel - 3).trim() + "...";
    }

    const promptText =
      textoBase +
      roteiroParaCena;

    // ==============================
    // GARANTIA ABSOLUTA
    // ==============================

    const promptFinal =
      promptText.substring(0, 1000);

    console.log("=================================");
    console.log("ENVIANDO PARA RUNWAY");
    console.log("Modelo: gen4.5");
    console.log("Ratio:", ratio);
    console.log("Duração: 5 segundos");
    console.log("Imagem recebida: SIM");
    console.log("Tamanho do prompt:", promptFinal.length);
    console.log("=================================");

    // ==============================
    // GERAR VÍDEO
    // ==============================

    const task = await client.imageToVideo.create({
      model: "gen4.5",
      promptImage: imagem,
      promptText: promptFinal,
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
