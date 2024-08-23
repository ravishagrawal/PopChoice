import { openai, supabase } from './config.js';

const buttonEl = document.getElementById ("submit-button")
const movieEl = document.getElementById ("movie")
const moodEl = document.getElementById ("mood")
const genreEl = document.getElementById ("genre")
const sectionEl = document.getElementById ("section-content")

buttonEl.addEventListener ("click", function(e){
    e.preventDefault()
    const query = `I like the ${movieEl.value} and I am in a mood
                to watch ${moodEl.value} and ${genreEl.value}. Suggest me 
                some movies`
    main (query)
})



async function main(input) {
  const embedding = await createEmbedding(input);
  const match = await findNearestMatch(embedding);
  await getChatCompletion(match, input);
}

// Create an embedding vector representing the query
async function createEmbedding(input) {
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input
  });
  return (embeddingResponse.data[0].embedding);
}

// Query Supabase and console.log() a semantically matching text chunk
async function findNearestMatch(embedding) {
  const { data } = await supabase.rpc('match_movies', {
    query_embedding: embedding,
    match_threshold: 0.50,
    match_count: 1
  });
  return { title: data[0].title, content: data[0].content };
}

// Use OpenAI to make the response conversational
const chatMessages = [{
    role: 'system',
    content: 'You are an enthusiastic movie expert who loves recommending movies to people. You will be given two pieces of information - some context about movies and a question. Your main job is to formulate a short answer to the question using the provided context. If you are unsure and cannot find the answer in the context, say, Sorry, I dont know the answer. Please do not make up the answer.'
}];

async function getChatCompletion(match, query) {
  
  const { title, content } = match
  
  chatMessages.push({
    role: 'user',
    content: `Context: ${content} Movie: ${title} Question: ${query}`
  });
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: chatMessages,
    temperature: 0.5,
    frequency_penalty: 0.5
  });
  
  sectionEl.innerHTML = ` <h1 class="movie-name"> ${title} </h1>
                          <p class="movie-response"> ${response.choices[0].message.content}</p>
                          <button class="go-again" id="go-again"> Go Again </button>
                          `
  const goAgainButton = document.getElementById("go-again");
    goAgainButton.addEventListener("click", function() {
        window.location.reload();
    });
}


