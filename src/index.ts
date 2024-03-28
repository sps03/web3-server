import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import passport from 'passport';
import session from 'express-session';
import { Strategy as TwitterStrategy, Profile as TwitterProfile } from 'passport-twitter';
const DiscordStrategy = require('passport-discord').Strategy;
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import cors from 'cors'; 
import mongoose from 'mongoose';
import userSchema from '../src/schema/userSchema';
import UserModel from './model/userModel.';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 8000;

app.use(session({
  secret: 'thisissecretkey', 
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(cors()); 
app.use(express.json()); 

mongoose.connect('mongodb://127.0.0.1:27017/web3');


const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to the database');
});

app.post('/store', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // Create a new user document using UserModel
    const newUser = new UserModel({ username, email, password });
    // Save the document to the database
    await newUser.save();

    res.status(201).json({ message: 'User data stored successfully' });
  } catch (error) {
    console.error('Error storing user data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

passport.use(new TwitterStrategy({
  consumerKey: process.env.TWITTER_CONSUMER_KEY!,
  consumerSecret: process.env.TWITTER_CONSUMER_SECRET!,
  callbackURL: "http://localhost:8000/auth/twitter/callback"
}, async (token, tokenSecret, profile, done) => {
  try {
    const username = (profile as TwitterProfile).username;
    console.log("Successful authentication TWITTER username:", username);
    done(null, { username });
  } catch (error) {
    done(error);
  }
}));


passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: "http://localhost:8000/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails && profile.emails[0] && profile.emails[0].value;
    if (!email) {
      return done(new Error('No email found in Google profile'));
    }
    console.log("Successful authentication GOOGLE email:", email);

    done(null, { email });
  } catch (error) {
  }
}));


passport.use(new DiscordStrategy({
  clientID: process.env.DISCORD_CLIENT_ID!,
  clientSecret: process.env.DISCORD_CLIENT_SECRET!,
  callbackURL: "http://localhost:8000/auth/discord/callback",
  scope: ['identify', 'email'] 
}, async (accessToken: string, _: string, profile: any, done: any) => {
  try {
    const username = profile.username;
    const email = profile.email;

    console.log("Successful authentication DISCORD username:", username);
    console.log("Successful authentication DISCORD email:", email);

    let user = await UserModel.findOne({ email });
    if (!user) {
      user = await UserModel.create({ email });
    }

    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));


passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID!,
  clientSecret: process.env.FACEBOOK_APP_SECRET!,
  callbackURL: "http://localhost:8000/auth/facebook/callback",
  profileFields: ['id', 'emails']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails && profile.emails[0] && profile.emails[0].value;
    if (!email) {
      return done(new Error('No email found in Facebook profile'));
    }
    console.log("Successful authentication FACEBOOK email:", email);

    let user = await UserModel.findOne({ email });
    if (!user) {
      user = await UserModel.create({ email });
    }
    done(null, user);
  } catch (error) {
  }
}));

passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});

app.get('/auth/twitter', passport.authenticate('twitter') );

// app.get('/auth/twitter/callback',
//   passport.authenticate('twitter', { successRedirect: 'http://localhost:3000/setting', failureRedirect: 'http://localhost:3000' })
// );

// app.get('/auth/twitter/callback',
//   passport.authenticate('twitter', { failureRedirect: 'http://localhost:3000' }),
//   (req, res) => {
//     const username = req.user; 
//     console.log("Twitter Username:", username);
//     const redirectPath = 'http://localhost:3000/setting'; 
//     res.json({ username, redirectPath }); 
//   }
// );
app.get('/auth/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: 'http://localhost:3000' }),
  (req, res) => {
    const username = req.user; 
    console.log("Twitter Username:", username);
    const redirectPath = `http://localhost:3000/setting?username=${username}`; 
    res.redirect(redirectPath); 
  }
);




app.get('/auth/discord', passport.authenticate('discord'));

app.get('/auth/discord/callback',
  passport.authenticate('discord', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('http://localhost:3000/setting'); 
  }
);

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// app.get('/auth/google/callback',
//   passport.authenticate('google', { failureRedirect: '/' }),
//   (req, res) => {
//     res.redirect('http://localhost:3000/setting'); 
//   }
// );

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req: any, res: any) => {
    const email = req.user ? req.user.email : ''; 
    console.log("Hello", email);
    res.redirect(`http://localhost:3000/setting?email=${email}`); 
  }
);
// app.get('/auth/google/callback',
//   passport.authenticate('google', { failureRedirect: '/' }),
//   (req, res) => {
//     const email = req.user ? req.user.email : ''; 
//     console.log("Hello", email);
//     const redirectUrl = `http://localhost:3000/setting?email=${email}`;
//     res.json({ email, redirectUrl });
  
//   }
// );




app.get('/auth/facebook',
  passport.authenticate('facebook', { scope: ['email'] })
);

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('http://localhost:3000/setting');
  }
);

app.post('/addemail', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    const newUser = new UserModel({ email });
    await newUser.save();

    res.status(201).json({ message: 'Email added successfully' });
  } catch (error) {
    console.error('Error adding email:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/save-user-data', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    console.log("Hit")

    const newUser = new UserModel({ email });
    
    await newUser.save();

    res.status(201).json({ message: 'User data stored successfully' });
  } catch (error) {
    console.error('Error storing user data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript server');
});

app.get('/greet', (req: Request, res: Response) => {
  const username = (req.user as any)?.username; 
  res.send(`Welcome, ${username || 'Guest'}!`);
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});