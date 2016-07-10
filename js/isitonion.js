/*
 * Provide functionality for
 * topical guessing game.
 *
 * API Calls in a game-loop
 * update a model, which is
 * driven by interface interaction.
 *
 * @name    isitonion
 * @author  mod_ave
 * @version 0.2
 */

/* Global blueprints. */

// Store the current article as a truncated object.
var currentArticle = {
    title: null,
    from: null,
    link: null,
    image : null
};

// Store zeroed player information.
var user = {
    attempts: 0,
    streak : 0
}

/* Useful web-specific constants. */

const HOST_URL = "http://www.reddit.com/r/";

const R = {
    THE_ONION: 'theonion',
    NOT_THE_ONION: 'nottheonion'
}

const badWords = [
    "Quiz:",
    "?"
]

/* MODEL */

/**
 *  Iterate upon the game loop.
 */
function iterate() {
    
    /* Initiate sequence. */
    getRandomArticle();
    
    /**
     *  Perform call to endpoint provided
     *  by 'Reddit' to fetch article content.
     */
    function getRandomArticle() {
        
        // Initially randomly decide on article type.
        var decision = (Math.random() > 0.5) ? R.THE_ONION : R.NOT_THE_ONION;
    
        // Make API request with contextual options.
        $.ajax(
            {
                // type: 'GET',
                url: HOST_URL + decision + "/random.json",
                success: function(result) { decodeArticle(result) },
                error: function() { console.log("Error: Request could not be made.") },
                // timeout: 60000, // No need for any more than a minute.
                // cache: false, // Since results are random and quick, caching is wasteful.
                dataType: 'json' // In case of funky redirects.
                
            });
        
    }
    
    /**
     *  Convert response into useful object.
     *
     *  @param response The response from the endpoint as JSON.
     */
    function decodeArticle(response) {
        
        // Ensure a response was found.
        if (response != null && response != undefined) {
            
            // Get the title of the retrieved article.
            currentArticle.title = response[0].data.children[0].data.title;
            
            /* Perform QA to reject certain articles. */
            
            // Ensure title is suitable.
            for(var word in badWords) {
                
                if(currentArticle.title.indexOf(word) > -1) {
                    
                    console.log("Warning: That article didn't look right - skipping it.");
                    
                    // Skip!
                    iterate();
                    return;
                    
                }
                
            }
            
            // Reject meta articles.
            if(response[0].data.children[0].kind.indexOf('self.' + R.THE_ONION) > -1 
               || response[0].data.children[0].kind.indexOf('self.' + R.NOT_THE_ONION) > -1) {
                
                // Skip!
                iterate();
                return;
                
            }
            
            // Get the subreddit of the retrieved article.
            currentArticle.from = response[0].data.children[0].data.subreddit.toLowerCase();
            
            // Get the link of the retrieved article.
            currentArticle.link = response[0].data.children[0].data.link;
            
            // Get a picture if it exists.
            currentArticle.image = response[0].data.children[0].data.preview.images[0].source.url;
            
            // Ensure the response was valid to some extent.
            if(currentArticle.from == null || currentArticle.title == null) {
                console.log("Error: Response missing elements.");
            }
            else {
                displayNextArticle();
            }

        }
        else {
            console.log("Error: Response state invalid.");
        }
        
    }
    
}

/**
 *  Mark the user's answer.
 *
 *  @param userAnswer The user's answer
 *                    as a member of the
 *                    indexing object R.
 */
function answer(userAnswer) {
    
    // Increment the number of attempts made thus far.
    user.attempts++;
    
    console.log("User answer: " + userAnswer);
    
    // Success...
    if(userAnswer == currentArticle.from) {
        
        // Log the result in the RTDB.
        database().ref('meta').transaction(function(meta) {
            meta.correct++;
            return meta;
        });
        
        // Display that the user was correct.
        displayCorrect();
        
        // Increment the user's correct streak.
        user.streak++;
        
    }
    // Failure...
    else {
        
        // Log the result in the RTDB.
        database().ref('meta').transaction(function(meta) {
            meta.incorrect++;
            return meta;
        });
        
        // Display that the user was incorrect.
        displayIncorrect();
        
        // Erase the user's correct streak.
        user.streak = 0;
        
    }
    
    displayUserAttempts();
    
    displayUserStreak();
    
    displayPreviousArticle();
    
    // Advance to the next article.
    iterate();
    
}

/* VIEW */

/**
 *  Update the display to reflect the new article.
 */
function displayNextArticle() {

    // Update the title.
    $('#article-title').text(currentArticle.title);

}

/**
 *  Unveil the previous article's link and image.
 */
function displayPreviousArticle() {
    
    if(currentArticle.image) {
        $('#thumbnail').attr('src', currentArticle.image);
    }
    
}

/**
 *  Provide visual cues to the user to indicate
 *  their correct choice.
 */
function displayCorrect() {
    
    $('#mark').text('Correct');
    
}

/**
 *  Provide visual cues to the user to indicate
 *  their incorrect choice.
 */
function displayIncorrect() {
    
    $('#mark').text('Incorrect');
    
}

/**
 * Provide visual cues to the user to indicate
 * the state of their streak of correct answers.
 */
function displayUserStreak() {
    
    $('#user-streak').text(user.streak);
    
}

/**
 * Provide visual cues to the user to indicate
 * their overall success.
 */
function displayUserAttempts() {
    
    $('#user-attempts').text(user.attempts);
    
}