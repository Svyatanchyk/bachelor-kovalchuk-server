export const generatePrompt = (
  nText: number,
  vertical: string,
  country: string,
  language: string[]
) => {
  const userMessage = `Generate exactly ${nText} short variations of text for a minimalist creative in the field of ${vertical}, targeting an audience in ${country}. You must use all the following languages ${language} in every variation. Each variation should be 5-8 words long, with a call to action. Do not include the country name in the text.

For each variation, randomly choose the structure from the following:

A main message + call to action, weight: 50%

A header + main message + some text + call to action, weight: 25%

A header + main message + call to action, weight: 25%

Each variation must contain between 2 and 4 components in total. The components may be in any order, but every component of a variation must be in the same language.

Each variation should be in only one of the provided languages. For example, if you are given English, Spanish, and French, create a variation entirely in English, another in Spanish, and a third in French.

Ensure that every language is used in one or more variations. If you are provided with multiple languages, each variation must use only one language, and all provided languages should be covered across the variations.

Additionally, please highlight some important words or phrases in each variation. The highlighted words should be words that are key to the message, such as action words, benefits, or features. Use asterisks like * to wrap around important words to highlight them.

The output should always have exactly ${nText} variations in the following format:

{ "1": ["Title", "Some text", "main message", "Call to action"], use only this language1 for all components for this variation
  "2": ["Title", "Main message", "Call to action"], use only this language2 for all components for this variation
  "3": ["Main message", "Call to action"], use only this language3 for for all components for this variation
  "4": ["Main message", "Call to action"], use only this language4 for all components for this variation
  ...
}

For example, if you have like: 'Generate 2 creative variations in English and Spanish', the output should look like this:
  
  { "1": ["Title", "Some text", "main message", "Call to action"], use only this language1 for all components for this variation
    "2": ["Main message", "Call to action"], use only this language2 for all components for this variation
  }

Or if you have like: 'Generate 3 creative variations in English, Spanish and French', the output should look like this:
  
    
    { "1": ["Title", "Some text", "main message", "Call to action"], use only this language1 for all components for this variation
      "2": ["Title", "Main message", "Call to action"], use only this language2 for all components for this variation
      "3": ["Main message", "Call to action"], use only this language3 for all components for this variation
    }

 Or if you have like: 'Generate 1 creative variations in English, Spanish and French', the output should look like this:
  
    
    { "1": ["Main message", "Call to action"], use only this language1 for all components for this variation
    }
  
The number of variations must be exactly the same as the number of creatives you are asked to generate. For example, if you ask for 3 variations, the output must contain exactly 3 variations.

Call to action must be two words strictly in length. Example: "Learn more", "Explore now" etc. IMPORTANT length of call to action should be no more than TWO words.
Title must be two or three words strictly in length. Example: "Dental implants" etc.
if we have odd number of variations than priority has the language1.
Do not include the country in variations. And do not apply the country as a languge.
Do not put the dot in the end of the text. "!" are allowed.

It is very important to follow all these instruction or it will extremely negatively effect the web site.

HERE ARE SOME RESTRICTIONS:
Title length: MAX 15 symbols
Some text : MAX 20 symbols
Main message : MAX 25 symbols
Call to action: MAX 12 symbols, avoid long words, max two words 

Do not include any code blocks. Just provide the raw JSON object with the variations.`;

  return userMessage;
};
