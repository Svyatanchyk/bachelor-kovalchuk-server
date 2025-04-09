export const generatePrompt = (
  nText: number,
  vertical: string,
  country: string,
  language: string
) => {
  const userMessage = `Generate **exactly** ${nText} short variations of text for a minimalist creative in the field of ${vertical}, targeting an audience in ${country}. Use the following languages ${language}. The content should be 10-15 words long with a call to action. Do not include the country name in the text.

    For each variation, **randomly choose the structure** from the following:
    - A header + main message + some text + call to action, weight: 0.33
    - A header + main message + call to action, weight: 0.33
    - A main message + call to action, weight: 0.33
    
    Each variation must contain between **2 and 4 components** in total, and the components may be in any order.
    
    Additionally, please **highlight** some important words or phrases in each variation. The highlighted words should be words that are key to the message, such as action words, benefits, or features. Use asterisks like * to wrap around important words to highlight them.
    
    The output should **always have exactly ${nText} variations**. The structure of each variation must be randomly chosen from the above list and can be different for each variation.
    
    The output should be in this format:
    
    {
      "1": ["Header", "Main message", "Some text", "Call to action"],
      "2": ["Main message", "Some text", "Call to action"],
      "3": ["Main message", "Call to action"],
      "4": ["Header", "Main message", "Call to action"],
      ...
    }
    
    Make sure to generate exactly ${nText} variations. Each time the output should have different combinations, keeping the random structure rule.
    
    Do not include any code blocks. Just provide the raw JSON object with the variations.`;

  return userMessage;
};
