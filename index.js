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

const dotenv = require('dotenv');
dotenv.config();


const mongoose = require('mongoose');
mongoose.connect(
    `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-3lggr.mongodb.net/test?retryWrites=true&w=majority`, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }
);

const db = mongoose.connection;

var Schema = mongoose.Schema;

var movieSchema = new Schema({
    title: String,
    releaseDate: Date,
    rating: Number,
    status: String,
    actorIds: [String]
});

const Movie = mongoose.model('Movie', movieSchema);

// gql`` parses your string into an AST
const typeDefs = gql `
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
    }

    type Mutation {
        addMovie(movie:MovieInput): [Movie]
    }

    type Subscription {
        movieAdded: Movie
    }

    input ActorInput {
        id: ID
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
const actors = [{
        id: "gordon",
        name: "Gordon Liu"
    },
    {
        id: "jackie",
        name: "Jackie Chan"
    }
];

const movies = [{
        id: 'dkdfk',
        title: "5 Deadly Venoms",
        releaseDate: "10-10-1983",
        actors: [{
            id: "jackie"
        }]
    },
    {
        id: 'xsssksks',
        title: "36th Chamber",
        releaseDate: "10-07-1983",
        rating: 5,
        actors: [{
            id: "gordon"
        }]
    }
];

const pubsub = new PubSub();
const MOVIE_ADDED = 'MOVIE_ADDED'

const resolvers = {
    Subscription: {
        movieAdded: {
            subscribe: () => pubsub.asyncIterator([MOVIE_ADDED])
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

    // Movie: {
    //     actors: (obj, arg, context) => {
    //         // DB Call
    //         const actorIds = obj.actors.map(actor => actor.id);
    //         const filteredActors = actors.filter(actor => {
    //             return actorIds.includes(actor.id);
    //         });
    //         return filteredActors;

    //         // return actors.filter(actor => actorIds.includes(actor.id));
    //     }
    // },

    Mutation: {
       addMovie:  async (obj, { movie }, { userId }) => {
            // Do mutation and of database stuff
            try {
                if (userId) {
                    
                    //mongo create
                    const newMovie = await Movie.create({
                        ...movie
                    });
                    pubsub.publish(MOVIE_ADDED, {movieAdded: newMovie})
                    const allMovies = Movie.find()
                    return allMovies;
                }
                return movies;
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
            userId: 'IamAloser'
        }
        return { ...fakeUser }
    }
});


db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
 console.log("✅ we're connected!")
});

server.listen({
    port: process.env.PORT || 4000
}).then(({
    url
}) => {
    console.log(`Server started at ${url}`);
});