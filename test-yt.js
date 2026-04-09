const url = "http://localhost:3000/api/search-youtube?q=pop+hits";
fetch(url).then(r => r.json()).then(console.log).catch(console.error);
