import { z } from "zod";
import { createRouter, publicQuery } from "../middleware.js";

const bookRecommendations: Record<string, string> = {
  fiction:
    "For fiction lovers, I recommend 'The Midnight Garden' - a beautifully woven tale of mystery and romance. 'Echoes of Tomorrow' offers a stunning futuristic narrative, while 'The Last Letter' delivers an emotionally gripping historical story.",
  "non-fiction":
    "In non-fiction, 'Thinking Clearly' provides essential insights into decision-making psychology. 'The Art of Rest' explores the science of relaxation and why it's crucial for productivity.",
  science:
    "Science enthusiasts should check out 'Quantum Worlds' for mind-bending physics concepts made accessible. 'The Nature Code' beautifully connects biology with natural patterns in our world.",
  history:
    "History buffs will love 'Empires of Sand' - a sweeping account of ancient civilizations. 'The Silk Roads' offers a fascinating perspective on how trade routes shaped our world.",
  technology:
    "For tech readers, 'Code & Craft' bridges the gap between programming and artistry. 'Digital Minds' provides thought-provoking insights into AI and its implications.",
  children:
    "Young readers will adore 'The Little Explorer' - a delightful adventure story with beautiful illustrations. 'Starlight Stories' offers magical bedtime tales that spark imagination.",
  "self-help":
    "Looking for personal growth? 'The 5 AM Club' transforms morning routines. 'Atomic Habits' provides practical, science-backed strategies for building lasting change.",
  mystery:
    "Mystery fans must read 'The Silent Witness' - a gripping Victorian-era whodunit. 'Shadow Play' delivers a masterful noir thriller with unforgettable characters.",
  fantasy:
    "Fantasy lovers, dive into 'Realm of Dragons' for epic world-building and adventure. 'The Crystal Throne' weaves a mesmerizing tale of magic and political intrigue.",
  romance:
    "For romance readers, 'Love in Paris' captures the magic of finding love abroad. 'The Coffee Shop Date' is a heartwarming contemporary love story.",
  default:
    "I'd be happy to help you find the perfect book! Could you tell me more about what genres you enjoy? We have excellent selections in Fiction, Science, History, Self-Help, Mystery, Fantasy, Romance, and more.",
};

export const chatRouter = createRouter({
  send: publicQuery
    .input(z.object({ message: z.string().min(1) }))
    .query(async ({ input }) => {
      const msg = input.message.toLowerCase();

      // Simple keyword matching for book recommendations
      let response = bookRecommendations.default;

      if (msg.includes("fiction") || msg.includes("novel")) {
        response = bookRecommendations.fiction;
      } else if (msg.includes("non-fiction") || msg.includes("non fiction")) {
        response = bookRecommendations["non-fiction"];
      } else if (msg.includes("science")) {
        response = bookRecommendations.science;
      } else if (msg.includes("history")) {
        response = bookRecommendations.history;
      } else if (msg.includes("tech") || msg.includes("programming")) {
        response = bookRecommendations.technology;
      } else if (msg.includes("children") || msg.includes("kids")) {
        response = bookRecommendations.children;
      } else if (
        msg.includes("self-help") ||
        msg.includes("self help") ||
        msg.includes("improve")
      ) {
        response = bookRecommendations["self-help"];
      } else if (msg.includes("mystery") || msg.includes("thriller")) {
        response = bookRecommendations.mystery;
      } else if (msg.includes("fantasy")) {
        response = bookRecommendations.fantasy;
      } else if (msg.includes("romance") || msg.includes("love")) {
        response = bookRecommendations.romance;
      } else if (
        msg.includes("recommend") ||
        msg.includes("suggest") ||
        msg.includes("best")
      ) {
        response =
          "Here are some of our most loved books: 'The Midnight Garden' (Fiction), 'Quantum Worlds' (Science), 'The 5 AM Club' (Self-Help), and 'Realm of Dragons' (Fantasy). Each has received outstanding reviews from our readers! What genre interests you most?";
      } else if (
        msg.includes("hello") ||
        msg.includes("hi") ||
        msg.includes("hey")
      ) {
        response =
          "Hello! Welcome to BookHaven! I'm your AI book assistant. I can help you discover your next great read, suggest books by genre, or answer questions about our collection. What type of books do you enjoy?";
      } else if (msg.includes("thank")) {
        response =
          "You're very welcome! Happy reading! If you need any more recommendations, I'm always here to help. Don't forget to check out our bestsellers section for curated picks.";
      } else if (msg.includes("price") || msg.includes("cost")) {
        response =
          "Our books range from $9.99 to $34.99, with most titles priced between $14.99 and $24.99. We also offer free shipping on orders over $35!";
      } else if (msg.includes("shipping") || msg.includes("delivery")) {
        response =
          "We offer free standard shipping on orders over $35! Standard delivery takes 3-5 business days. Express shipping (1-2 days) is available for $9.99.";
      }

      return { reply: response };
    }),
});
