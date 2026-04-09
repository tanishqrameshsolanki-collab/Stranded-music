const url = "https://itunes.apple.com/search?term=pop+hits&entity=song&limit=25";
fetch(url).then(r => r.json()).then(data => console.log(data.resultCount)).catch(console.error);
