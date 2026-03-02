const quotes = [
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
  { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Your limitation—it's only your imagination.", author: "Unknown" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
  { text: "Dream it. Wish it. Do it.", author: "Unknown" },
  { text: "Stay focused and never give up.", author: "Unknown" },
  { text: "Little by little, one travels far.", author: "J.R.R. Tolkien" },
  { text: "What we achieve inwardly will change outer reality.", author: "Plutarch" },
  { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
  { text: "Don't stop when you're tired. Stop when you're done.", author: "Unknown" },
  { text: "Wake up with determination. Go to bed with satisfaction.", author: "Unknown" },
  { text: "시작이 반이다.", author: "Korean Proverb" },
  { text: "천리길도 한 걸음부터.", author: "Korean Proverb" },
  { text: "될 때까지 하면 된다.", author: "Korean Proverb" },
  { text: "오늘 할 수 있는 일을 내일로 미루지 마라.", author: "Benjamin Franklin" },
  { text: "고생 끝에 낙이 온다.", author: "Korean Proverb" },
];

export function getRandomQuote() {
  return quotes[Math.floor(Math.random() * quotes.length)];
}
