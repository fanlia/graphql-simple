

const graphql = require('graphql')

exports.graphql = graphql

const {
  makeExecutableSchema,
} = require('@graphql-tools/schema')

const {
    GraphQLJSON,
    GraphQLJSONObject,
} = require('graphql-type-json')

const resolveFunctions = {
    JSON: GraphQLJSON,
    JSONObject: GraphQLJSONObject,
}

const buildSchema = (typeDefs, resolvers) => {
    return makeExecutableSchema({
        typeDefs,
        resolvers: {
            ...resolveFunctions,
            ...resolvers,
        },
    })
}

exports.buildSchema = buildSchema

const { graphqlHTTP } = require('express-graphql')

const scalarify = (schema) => `
scalar JSON
scalar JSONObject
${schema}
`
exports.scalarify = scalarify

const graphiql = ({
    api,
    schema,
    resolver,
}) => {

    schema = scalarify(schema)

    schema = buildSchema(schema, resolver)

    return graphqlHTTP(async (req, res) => {
        const startTime = Date.now()

        const rootValue = typeof api === 'function' ? await api(req) : api

        return {
            schema,
            rootValue,
            graphiql: true,
            customFormatErrorFn: error => ({
                message: error.message,
                stack: error.stack,
            }),
            extensions: ({
                document,
                operationName,
                result,
            }) => {
                if (Array.isArray(result.errors) && result.errors.length > 0) {
                    res.status(400)
                }
                return {
                    took: Date.now() - startTime,
                }
            },
        }
    })
}

exports.graphiql = graphiql
