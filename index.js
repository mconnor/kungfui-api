const {
    ApolloServer,
    gql
} = require("apollo-server");
const {
    GraphQLScalarType
} = require('graphql');
const {
    Kind
} = require('graphql/language')

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

    type Mutation {
        addMovie(movie:MovieInput): [Movie]
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

const resolvers = {
    Query: {
        movies: () => {
            return movies;
        },
        movie: (obj, {
            id
        }, context, info) => {
            // console.log('id ' ,id)
            const foundMovie = movies.find(movie => {
                return movie.id === id;
            });
            return foundMovie;
        },
    },

    Movie: {
        actors: (obj, arg, context) => {
            // DB Call
            const actorIds = obj.actors.map(actor => actor.id);
            const filteredActors = actors.filter(actor => {
                return actorIds.includes(actor.id);
            });
            return filteredActors;

            // return actors.filter(actor => actorIds.includes(actor.id));
        }
    },

    Mutation: {
        addMovie: (obj, { movie }, context) => {
          // Do mutation and of database stuff
          const newMoviesList = [
            ...movies,
            // new movie data
            movie
          ];
          // Return data as expected in schema
          return newMoviesList;
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

server.listen({
    port: process.env.PORT || 4000
}).then(({
    url
}) => {
    console.log(`Server started at ${url}`);
});