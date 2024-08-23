import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import moviesData from "./content.js"

async function splitDocument() {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 250,
    chunkOverlap: 35,
  });
  
  const results = [];
  
  for (const movie of moviesData) {
    const splitContent = await splitter.createDocuments([movie.content]);
    for (const chunk of splitContent) {
      results.push({
        title: movie.title,
        content: chunk.pageContent,
      });
    }
  }
  
  return results;
}

async function createAndStoreEmbeddings() {
  const chunkData = await splitDocument();
  
  const data = await Promise.all(
    chunkData.map(async (chunk) => {
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: chunk.content
      });
      
      return { 
        title: chunk.title, 
        content: chunk.content, 
        embedding: embeddingResponse.data[0].embedding 
      };
    })
  );

  await supabase.from('movies').insert(data);
  console.log('SUCCESS!');
}

createAndStoreEmbeddings();
