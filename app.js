document.addEventListener('DOMContentLoaded', () => {

    // --- PWA Service Worker Registration ---
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker registered with scope:', registration.scope);
            }).catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    }

    // --- Dictionary Configuration ---
    // This makes it easy to add more dictionaries in the future.
    const dictionaryConfig = [
        { name: "Biology", path: "dictionaries/biology.json", type: "single" },
        { name: "Physics", path: "dictionaries/physics.json", type: "single" },
        { name: "Geography", path: "dictionaries/geography.json", type: "single" },
        {
            name: "Soomaali Mansuur",
            path: "dictionaries/soomaali_mansuur/",
            type: "multi",
            files: "abcdefghijklmnopqrstuvwxy".split('') // a-y
        }
    ];

    // --- State ---
    let allData = {}; // To store all loaded dictionary data

    // --- DOM Elements ---
    const tabSearch = document.getElementById('tab-search');
    const tabShowAll = document.getElementById('tab-show-all');
    const searchView = document.getElementById('search-view');
    const dictionariesView = document.getElementById('dictionaries-view');
    const searchInput = document.getElementById('search-input');
    const searchResultsContainer = document.getElementById('search-results');
    const dictionaryListContainer = document.getElementById('dictionary-list');
    const dictionaryContentContainer = document.getElementById('dictionary-content');
    const currentDictionaryTitle = document.getElementById('current-dictionary-title');

    // --- Functions ---

 /**
 * Fetches and loads all dictionaries defined in the config.
 */
async function loadAllData() {
    for (const dict of dictionaryConfig) {
        if (dict.type === 'single') {
            try {
                const response = await fetch(dict.path);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                allData[dict.name] = await response.json();
            } catch (e) {
                console.error(`Failed to load ${dict.name}`, e);
                allData[dict.name] = {}; // Avoid errors later
            }
        } else if (dict.type === 'multi') {
            const multiFileData = {};
            const promises = dict.files.map(file =>
                fetch(`${dict.path}${file}.json`)
                .then(res => {
                    if (!res.ok) {
                        // This will cause the promise to be 'rejected' but won't stop others.
                        throw new Error(`File not found: ${file}.json`);
                    }
                    return res.json();
                })
            );

            // Use Promise.allSettled to wait for all fetches, even if some fail (404)
            const results = await Promise.allSettled(promises);

            results.forEach(result => {
                // Only process the promises that were 'fulfilled' (i.e., the file existed and was loaded)
                if (result.status === 'fulfilled') {
                    Object.assign(multiFileData, result.value);
                }
            });
            
            allData[dict.name] = multiFileData;
        }
    }
    console.log("All dictionaries loaded.", allData);
    populateDictionaryList();
}

    /**
     * Handles the search logic.
     */
    function handleSearch(event) {
        const query = event.target.value.trim().toLowerCase();
        searchResultsContainer.innerHTML = '';

        if (query.length === 0) {
            searchResultsContainer.innerHTML = `<p class="placeholder">Search results will appear here.</p>`;
            return;
        }

        let resultsFound = false;
        for (const dictName in allData) {
            const dictionary = allData[dictName];
            for (const term in dictionary) {
                if (term.toLowerCase().startsWith(query)) {
                    resultsFound = true;
                    const definition = dictionary[term];
                    const resultItem = document.createElement('div');
                    resultItem.className = 'result-item';
                    resultItem.innerHTML = `
                        <p><strong>${term}</strong>: ${definition}</p>
                        <span class="source">${dictName}</span>
                    `;
                    searchResultsContainer.appendChild(resultItem);
                }
            }
        }

        if (!resultsFound) {
            searchResultsContainer.innerHTML = `<p class="placeholder">No results found for "${query}".</p>`;
        }
    }
    
    /**
     * Creates buttons for each dictionary in the "Show All" tab.
     */
    function populateDictionaryList() {
        dictionaryListContainer.innerHTML = '';
        dictionaryConfig.forEach(dict => {
            const button = document.createElement('button');
            button.className = 'dict-btn';
            button.textContent = dict.name;
            button.dataset.dictName = dict.name;
            button.addEventListener('click', () => {
                // Style the selected button
                document.querySelectorAll('.dict-btn').forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');
                displayDictionaryContent(dict.name);
            });
            dictionaryListContainer.appendChild(button);
        });
    }

    /**
     * Displays all entries for a selected dictionary.
     */
    function displayDictionaryContent(dictName) {
        const dictionary = allData[dictName];
        dictionaryContentContainer.innerHTML = '';
        currentDictionaryTitle.textContent = dictName;

        const sortedTerms = Object.keys(dictionary).sort((a, b) => a.localeCompare(b));

        if (sortedTerms.length === 0) {
            dictionaryContentContainer.innerHTML = `<p class="placeholder">This dictionary is empty or failed to load.</p>`;
            return;
        }

        for (const term of sortedTerms) {
            const definition = dictionary[term];
            const entryItem = document.createElement('div');
            entryItem.className = 'entry-item';
            entryItem.innerHTML = `<p><strong>${term}</strong>: ${definition}</p>`;
            dictionaryContentContainer.appendChild(entryItem);
        }
    }
    
    /**
     * Switches between the 'Search' and 'Show All' tabs.
     */
    function switchTab(targetTab) {
        if (targetTab === 'search') {
            tabSearch.classList.add('active');
            tabShowAll.classList.remove('active');
            searchView.classList.add('active');
            dictionariesView.classList.remove('active');
        } else {
            tabSearch.classList.remove('active');
            tabShowAll.classList.add('active');
            searchView.classList.remove('active');
            dictionariesView.classList.add('active');
        }
    }


    // --- Event Listeners ---
    searchInput.addEventListener('input', handleSearch);
    tabSearch.addEventListener('click', () => switchTab('search'));
    tabShowAll.addEventListener('click', () => switchTab('show-all'));

    // --- Initial Load ---
    loadAllData();
});