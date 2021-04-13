const {
    ApolloServer,
    gql,
    PubSub,
} = require("apollo-server");
const {
    GraphQLScalarType
} = require('graphql');
const {
    Kind
} = require('graphql/language');

//for using .env file
const dotenv = require('dotenv');
const mongoose = require('mongoose');


dotenv.config();


// const { Schema } = mongoose;



mongoose.connect(
    `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-3lggr.mongodb.net/test?retryWrites=true&w=majority`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}
);

const db = mongoose.connection;
const { Schema } = mongoose;

const movieSchema = new Schema({
    title: String,
    releaseDate: Date,
    rating: Number,
    status: String,
    actorIds: [String]
});


const actorSchema = new Schema({
    name: String,
    gender: String,
    age: Number,
    status: String,
    movieIds: [String]
});



const Movie = mongoose.model('Movie', movieSchema);
const Actor = mongoose.model('Actor', actorSchema);
// gql`` parses your string into an AST
const typeDefs = gql`
    scalar Date



    enum Status {
        WATCHED
        INTERESTED
        NOT_INTERESTED
        UNKNOWN
    }

    type Actor {
        id: ID!
        name: String!
        movies: [Movie]
        gender: String
    }

    type Movie {
        id: ID!
        title: String!
        releaseDate: String
        rating: Int
        actors: [Actor]
        status: Status
    }

    type Query {
        movies: [Movie]
        movie(id: ID): Movie
        actors: [Actor]
        actor(id: ID): Actor
        
    }

    
    
    type Mutation {
        addMovie(movie:MovieInput): [Movie]
        addActor(actor:ActorInput): [Actor]     
    }

 

    type Subscription {
        movieAdded: Movie
        actorAdded: Actor
    }

    input ActorInput {
        id: ID
        name: String
        gender: String
        age: Int
        movies: [MovieInput]

    }

    input MovieInput {
        id: ID
        title: String
        releaseDate: String
        rating: Int
        status: Status
        actors: [ActorInput]
    }

    
`;
//   end of graphql

const pubsub = new PubSub();
const MOVIE_ADDED = 'MOVIE_ADDED'
const  ACTOR_ADDED = 'ACTOR_ADDED'

const resolvers = {
    Subscription: {
        movieAdded: {
            subscribe: () => pubsub.asyncIterator([MOVIE_ADDED])
        },
        actorAdded: {
            subscribe: () => pubsub.asyncIterator([ACTOR_ADDED])
        }
    },

    Query: {
        movies: async () => {
            try {
                const allMovies = await Movie.find()
                return allMovies;
            } catch (e) {
                console.log('e', e);
                return [];
            }
        },
        movie: async (obj, { id }) => {
            try {
                const foundMovie = await Movie.findById(id);
                return foundMovie;
            } catch (e) {
                console.log('e', e);
                return {};
            }
        },
    },

    Mutation: {
        addMovie: async (obj, { movie }, { userId }) => {
            // Do mutation and of database stuff
            try {
                if (userId) {

                    //mongo create
                    const newMovie = await Movie.create({
                        ...movie
                    });
                    pubsub.publish(MOVIE_ADDED, { movieAdded: newMovie })
                    const allMovies = Movie.find()
                    return allMovies;
                }
                return movies;
            } catch (e) {
                console.log('e', e)
                return []
            }
        },

        addActor:  async (obj, { actor }, { userId }) => {
            // Do mutation and of database stuff
            try {
                if (userId) {

                    //mongo create
                    const newActor = await Actor.create({
                        ...actor
                    });
                    pubsub.publish(ACTOR_ADDED, { actorAdded: newActor })
                    const allActors = Actor.find()
                    return allActors;
                }
                return actors;
            } catch (e) {
                console.log('e', e)
                return []
            }
        }
    },

    Date: new GraphQLScalarType({
        name: 'Date',
        description: "it's a date, deal",
        parseValue(value) {
            return value
        },
        serialize(value) {
            return value
        },
        parseLiteral(ast) {
            if (ast.kind === Kind.INT) {
                return new Date(ast.value)
            }
            return null;
        }
    })
};

const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    playground: true,
    context: ({ req }) => {

        const fakeUser = {
            userId: 'SomeFakeUserName'
        }
        return { ...fakeUser }
    }
});


db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log("✅ we're connected!" + process.env.MONGO_PASSWORD)

    server.listen({
        port: process.env.PORT || 4000
    }).then(({
        url
    }) => {
        console.log(`Server started at ${url}`);
    });


});

