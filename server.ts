import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up body parsing with high limit for base64 images
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// Initialize Gemini Client safely
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Historical Era Configuration Data
const ERA_PRESETS = [
  {
    id: "egypt",
    name: "Ancient Egypt",
    year: "1330 BC",
    themeColor: "amber",
    scene: "the golden chamber of a towering pharaoh tomb with towering hieroglyph columns and an ambient warm candlelight glow overlooking the desert dunes",
    roles: ["Pharaoh", "High Priestess of Isis", "Elite Royal Guardian"],
    defaultRole: "Pharaoh",
    backdropUrl: "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&q=80&w=800",
    suggestedProps: [
      { char: "👑", name: "Royal Crown", type: "head" },
      { char: "💎", name: "Ankh Amulet", type: "chest" },
      { char: "🪶", name: "Sacred Feather", type: "accessory" }
    ],
    defaultFilter: "sepia",
    temporalFact: "The Pyramids of Giza were already ancient history by King Tutankhamun's reign!"
  },
  {
    id: "rome",
    name: "Roman Empire",
    year: "80 AD",
    themeColor: "red",
    scene: "the high balconies of the Colosseum in Rome during a major festival, under a brilliant radiant warm sun with floating celebratory laurels",
    roles: ["Centurion General", "Livia Augusta (Noble Vestal)", "Laurel Wreathed Emperor"],
    defaultRole: "Centurion General",
    backdropUrl: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&q=80&w=800",
    suggestedProps: [
      { char: "🌿", name: "Laurel Wreath", type: "head" },
      { char: "🛡️", name: "Gladiator Shield", type: "accessory" },
      { char: "⚔️", name: "Bronze Gladius", type: "accessory" }
    ],
    defaultFilter: "warm",
    temporalFact: "The Roman Colosseum's grand opening featured games that lasted for over 100 days straight."
  },
  {
    id: "viking",
    name: "Viking Voyage",
    year: "890 AD",
    themeColor: "blue",
    scene: "the wooden deck of a majestic Viking longship riding a heavy ocean mist, heading towards lush foggy Scandinavian fjords with custom carved dragon bows",
    roles: ["Berserker Chieftain", "Valiant Shieldmaiden", "Nordic Seer Guide"],
    defaultRole: "Berserker Chieftain",
    backdropUrl: "https://images.unsplash.com/photo-1578426218704-5162fa900135?auto=format&fit=crop&q=80&w=800",
    suggestedProps: [
      { char: "🪖", name: "Iron Helmet", type: "head" },
      { char: "🛡️", name: "Nordic Roundshield", type: "accessory" },
      { char: "🔥", name: "Odin's Torch", type: "accessory" }
    ],
    defaultFilter: "cool-mist",
    temporalFact: "Viking longships were completely symmetrical, allowing them to reverse direction without turning around!"
  },
  {
    id: "medieval",
    name: "High Medieval",
    year: "1215 AD",
    themeColor: "slate",
    scene: "inside a magnificent Gothic royal court banqueting hall with gorgeous stained-glass rose windows casting colorful beams over stone pillars",
    roles: ["Gilded Armor Knight", "Regal Monarch", "Mystical Hermit Alchemist"],
    defaultRole: "Gilded Armor Knight",
    backdropUrl: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&q=80&w=800",
    suggestedProps: [
      { char: "👑", name: "Monarch Guard", type: "head" },
      { char: "🛡️", name: "Lion Crest", type: "accessory" },
      { char: "🪄", name: "Magical Scepter", type: "accessory" }
    ],
    defaultFilter: "vintage",
    temporalFact: "Authentic medieval longbowmen developed highly reinforced arm bones due to drawing 150 lbs of tension repeatedly!"
  },
  {
    id: "renaissance",
    name: "Italics Renaissance",
    year: "1505 AD",
    themeColor: "amber",
    scene: "the airy candlelit studio of an Italian master artist filled with rich velvet drapes, marble sculptures, and unfinished elegant classical oil portraits",
    roles: ["Florentine Patron", "Eminent Artist Guild Scholar", "Mona Lisa-style Aristocrat"],
    defaultRole: "Florentine Patron",
    backdropUrl: "https://images.unsplash.com/photo-1580136579312-94651dfd596d?auto=format&fit=crop&q=80&w=800",
    suggestedProps: [
      { char: "🎨", name: "Artist Palette", type: "accessory" },
      { char: "🎓", name: "Renaissance Cap", type: "head" },
      { char: "📜", name: "Drafting Scroll", type: "accessory" }
    ],
    defaultFilter: "golden-classic",
    temporalFact: "Leonardo da Vinci wrote his journals in reverse mirror writing to keep his futuristic designs secret!"
  },
  {
    id: "cowboy",
    name: "Wild West Frontier",
    year: "1878 AD",
    themeColor: "orange",
    scene: "the sun-baked dusty main road of a Nevada frontier town, standing outside a wooden saloon entrance right as the orange sun begins to dip below the plateaus",
    roles: ["Desert Cowboy Marshall", "Frontier Pioneer Explorer", "Saloon Cardsharp Bandit"],
    defaultRole: "Desert Cowboy Marshall",
    backdropUrl: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&q=80&w=800",
    suggestedProps: [
      { char: "🤠", name: "Cowboy Hat", type: "head" },
      { char: "⭐", name: "Marshall Badge", type: "chest" },
      { char: "🎸", name: "Frontier Guitar", type: "accessory" }
    ],
    defaultFilter: "sepia-grain",
    temporalFact: "Cowboy hats were originally rarely worn by cattle drivers; most preferred simple structured bowler hats!"
  },
  {
    id: "jazz",
    name: "The Jazz Age",
    year: "1925 AD",
    themeColor: "rose",
    scene: "a bustling underground New York speakeasy bar filled with glowing warm lamps, vintage brass horns, Art Deco mirror patterns, and rich rising ambient smoke",
    roles: ["Speakeasy Flapper Vocalist", "Dapper Jazz Saxophone Legend", "Art Deco Salon Socialite"],
    defaultRole: "Dapper Jazz Saxophone Legend",
    backdropUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=800",
    suggestedProps: [
      { char: "🎷", name: "Brass Saxophone", type: "accessory" },
      { char: "🎩", name: "Dapper Fedora", type: "head" },
      { char: "💍", name: "Gatsby Pearls", type: "chest" }
    ],
    defaultFilter: "mono-vintage",
    temporalFact: "Radio transformed pop music in the 1920s, growing from almost no homes to over 12 million listeners by 1930."
  },
  {
    id: "space",
    name: "1950s Atomic Space",
    year: "1958 AD",
    themeColor: "cyan",
    scene: "a beautiful retro-futuristic atomic age space colony observatory, with bubbling green science tubes and giant round domes looking out towards a red neon planet",
    roles: ["Ray-Gun Rocket Pilot", "Atomic Astro-Navigator", "Glow-Visor Cadet Officer"],
    defaultRole: "Ray-Gun Rocket Pilot",
    backdropUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800",
    suggestedProps: [
      { char: "🛸", name: "Mini Cruiser", type: "accessory" },
      { char: "🕶️", name: "Sci-Fi Goggles", type: "head" },
      { char: "🪐", name: "Gravity Ring", type: "accessory" }
    ],
    defaultFilter: "cyber-cinematic",
    temporalFact: "The 1950s 'Space Age' design philosophy was strongly influenced by the real-world satellite launch of Sputnik in 1957."
  }
];

// 1. Endpoint: Retrieve presets
app.get("/api/temporal/presets", (req, res) => {
  res.json({ presets: ERA_PRESETS });
});

// 2. Endpoint: Analyze face structure and style to compile a generative prompt
app.post("/api/temporal/analyze", async (req, res) => {
  try {
    const { imageParts } = req.body;
    if (!imageParts) {
      return res.status(400).json({ error: "No user snapshot provided." });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // In case of no API Key, return a helpful generic fallback description
      return res.json({
        success: true,
        isDemo: true,
        description: "An expressive person with distinct facial structure, clear features, and a bright friendly neutral expression.",
        suggestion: "Using regional average details to secure temporal synchronization!"
      });
    }

    // Prepare content parts for Gemini Multimodal analyzer - expected: { inlineData: { data, mimeType } }
    const filePart = {
      inlineData: {
        mimeType: "image/png",
        data: imageParts.split(",")[1] || imageParts // strip base64 descriptor if present
      }
    };

    const textPrompt = `Analyze this person's key facial features for a historical photo booth transformation. 
Focus strictly on: approximate gender presentation, relative age tier (e.g. young adult, mature adult), eye structure, hair color & length, presence of visible glasses or facial hair, and overall expression.
Return a concise summary (exactly 2-3 detailed sentences) that describes these physical attributes objectively. 
Do not include any conversational intro, meta-information, or commentary. Keep it 100% focused on physical traits.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [filePart, textPrompt]
    });

    const description = response.text?.trim() || "A majestic person with clear gaze and neutral, pleasant expression.";

    res.json({
      success: true,
      description,
      isDemo: false
    });
  } catch (error: any) {
    console.error("AI Face analysis failure:", error);
    res.json({
      success: true,
      isDemo: true,
      description: "An elegant adventurer ready to explore the coordinates of the temporal matrix.",
      error: error.message
    });
  }
});

// 3. Endpoint: AI Temporal Reconstruction (Image Generation)
app.post("/api/temporal/generate", async (req, res) => {
  try {
    const { portraitPrompt, eraId, styleType, customEra } = req.body;
    
    const eraPreset = customEra || ERA_PRESETS.find(e => e.id === eraId) || ERA_PRESETS[0];
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(400).json({
        error: "Temporal Generative core is offline (Missing GEMINI_API_KEY). Please use the high-fidelity Instant Digital Swapper instead!",
        code: "NO_SECRET_KEY"
      });
    }

    // Build the ultimate historical prompt
    const baseStyle = styleType || "Photorealistic historical oil painting";
    const absolutePrompt = `A high-quality, professional, masterfully colored ${baseStyle} of a person characterized by: ${portraitPrompt}. 
The person is dressed as a classic ${eraPreset.defaultRole} from ${eraPreset.name}. 
The portrait is set in ${eraPreset.scene}. 
Masterpiece artistic texture, rich physical fabrics, warm museum lighting, historical photorealism, award-winning illustration style, no visual text or badges, gorgeous composition, ${eraPreset.year} era authenticity.`;

    console.log("TEMPORAL GENERATION PROMPT:", absolutePrompt);

    // Call gemini-2.5-flash-image for image generation as instructed in the gemini-api skill docs
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            text: absolutePrompt
          }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      }
    });

    let generatedBase64 = "";
    
    // Scan parts to isolate inlineData images
    if (response?.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          generatedBase64 = part.inlineData.data;
          break;
        }
      }
    }

    if (!generatedBase64) {
      throw new Error("Reconstruction artifact failed: No generation data returned from model.");
    }

    res.json({
      success: true,
      imageUrl: `data:image/png;base64,${generatedBase64}`
    });

  } catch (error: any) {
    console.error("AI Genesis failed:", error);
    res.status(500).json({
      error: error.message || "An error occurred during temporal portrait fabrication.",
      code: "API_ERROR"
    });
  }
});

// Start-up sequence configuration
async function startServer() {
  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Chronicle Engine REST Server] Ready at http://localhost:${PORT}`);
  });
}

startServer();
