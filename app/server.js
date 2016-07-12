// example bot
import botkit from 'botkit';
const Yelp = require('yelp');

console.log('starting bot');

// botkit controller
const controller = botkit.slackbot({
  debug: false,
});

// initialize slackbot
const slackbot = controller.spawn({
  token: process.env.SLACK_BOT_TOKEN,
  // this grabs the slack token we exported earlier
}).startRTM(err => {
  // start the real time message client
  if (err) { throw new Error(err); }
});

// Yelp's GitHub page for Node.js https://github.com/olalonde/node-yelp provided
// assistance with creating the following code to initialize Yelp's API
// Initialize Yelp
const yelp = new Yelp({
  consumer_key: process.env.YELP_CONSUMER_KEY,
  consumer_secret: process.env.YELP_CONSUMER_SECRET,
  token: process.env.YELP_TOKEN,
  token_secret: process.env.YELP_TOKEN_SECRET,
});

// Controller hears for food request stuff, information based off of https://github.com/howdyai/botkit/blob/master/readme.md#receiving-messages
controller.hears(['food', 'hungry', 'eat'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  // start a conversation to handle this response.
  bot.startConversation(message, function (err, convo) {
    // Ask if the user wants help
    convo.ask('Would you like food recommendations near you?', [
      {
        pattern: bot.utterances.yes,
        callback(response, convo) {
          convo.say('Brilliant');
          convo.next();

          // ask for type of food
          const FoodRequest = { key: 'foodTypeYelp', multiple: false };
          convo.ask('What type of food are you hungry for buddy?', (response) => {
            const UserLocation = { key: 'UserLocation', multiple: false };

            convo.say('You chose wisely');
            convo.next();

            // ask for location
            convo.ask('What town and state are you hoping to eat in, my friend?',

                () => {
                  const YelpFoodSearch = convo.extractResponse('foodTypeYelp');
                  const YelpCitySearch = convo.extractResponse('UserLocation');

                  yelp.search({ term: YelpFoodSearch, location: YelpCitySearch, limit: 1 })

                  // Information for user was found
                  .then((data) => {
                    bot.reply(message,
                      {
                        text: 'This is definitely what I recommend:',
                        attachments: [
                          {
                            title: `${data.businesses[0].name}`,
                            title_link: `${data.businesses[0].url}`,
                            text: `${data.businesses[0].snippet_text}`,
                            image_url: `${data.businesses[0].image_url}`,
                          },
                        ],
                      });
                  })

                  // Information was not found
                  .catch((err) => {
                    convo.say('I am sorry to inform you that there is nothing in your area');
                  });
                  convo.next();
                }, UserLocation);
            convo.next();
          }, FoodRequest);
          convo.next();
        },
      },
      {
        // user did not want help
        pattern: bot.utterances.no,
        callback(response, convo) {
          convo.say('Perhaps later, see ya!');
          convo.next();
        },
      },
    ]);
  });
});

// prepare webhook
// for now we won't use this but feel free to look up slack webhooks
controller.setupWebserver(process.env.PORT || 3001, (err, webserver) => {
  controller.createWebhookEndpoints(webserver, slackbot, () => {
    if (err) { throw new Error(err); }
  });
});


controller.on('outgoing_webhook', (bot, message) => {
  bot.replyPublic(message, 'yeah yeah');
});

// example hello response
controller.hears(['hello', 'hi', 'howdy', 'hey'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  bot.api.users.info({ user: message.user }, (err, res) => {
    if (res) {
      bot.reply(message, `Hello, ${res.user.name}!`);
    } else {
      bot.reply(message, 'Hello there!');
    }
  });
});

// based off code in https://github.com/howdyai/botkit#botreply
controller.hears(['going', 'whats'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  bot.reply(message, 'Just chilling!');
});
