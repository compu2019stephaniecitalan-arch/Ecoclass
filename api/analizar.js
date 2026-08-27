export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Método no permitido"
        });
    }

    try {
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({
                error: "No se recibió ninguna imagen"
            });
        }

        const response = await fetch(
            "https://api.openai.com/v1/responses",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
                },

                body: JSON.stringify({
                    model: "gpt-4.1-mini",

                    input: [
                        {
                            role: "user",

                            content: [
                                {
                                    type: "input_text",

                                    text: `
Analiza esta imagen para EcoClass,
un proyecto de 2.º básico para una Feria Científica.

Identifica el objeto o residuo que aparece.

Clasifícalo en UNA de estas categorías:

- Orgánico
- Papel y cartón
- Plástico
- Vidrio
- Metal
- Electrónico
- Especial/Peligroso
- No reciclable
- Otro

IMPORTANTE:
No inventes una identificación si no puedes reconocer
el objeto con suficiente confianza.

Devuelve ÚNICAMENTE un JSON con este formato:

{
  "nombre": "nombre del residuo",
  "categoria": "categoría",
  "contenedor": "contenedor recomendado",
  "explicacion": "explicación breve",
  "recomendacion": "recomendación para desecharlo correctamente"
}

Ten en cuenta que las normas de reciclaje pueden variar
según el lugar. Si el residuo necesita un tratamiento
especial, indícalo.
`
                                },

                                {
                                    type: "input_image",
                                    image_url: image
                                }
                            ]
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error(data);

            return res.status(response.status).json({
                error: "La API de visión devolvió un error."
            });
        }

        const texto = data.output
            ?.flatMap(item => item.content || [])
            ?.find(item => item.type === "output_text")
            ?.text;

        if (!texto) {
            return res.status(500).json({
                error: "No se recibió una respuesta válida."
            });
        }

        let resultado;

        try {
            resultado = JSON.parse(texto);
        } catch {
            const limpio = texto
                .replace(/```json/gi, "")
                .replace(/```/g, "")
                .trim();

            resultado = JSON.parse(limpio);
        }

        return res.status(200).json(resultado);

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            error: "Error interno del servidor."
        });
    }
}
