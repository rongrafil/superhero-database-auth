const appsync = require('@aws-cdk/aws-appsync');
const dynamodb = require('@aws-cdk/aws-dynamodb');
const cdk = require('@aws-cdk/core');

class CdkStack extends cdk.Stack {
  /**
   *
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    //provisions DynamoDB table
    const table = new dynamodb.Table(this, 'Superhero-DB', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
    });

    //sets two global secondary indexes to provisioned table. table must be empty in order to provision two GSIs simultaenously
    table.addGlobalSecondaryIndex({
      indexName: 'hero_name-index',
      partitionKey: { name: 'hero_name', type: dynamodb.AttributeType.STRING },
    });

    table.addGlobalSecondaryIndex({
      indexName: 'powers-index',
      partitionKey: { name: 'powers', type: dynamodb.AttributeType.STRING },
    });

    //provisions Appsync Graphql API
    const api = new appsync.GraphqlApi(this, 'Superhero-API', {
      name: 'Superhero-API',
      schema: appsync.Schema.fromAsset('graphql/schema.graphql'), 
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY,
        },
      },
    });

    //connects Graphql API to DynamoDB table as datasource
    const dataSource = api.addDynamoDbDataSource('MyDataSource', table);

    //configures query and mutation resolvers to API
    dataSource.createResolver({
      typeName: 'Query',
      fieldName: 'getHero', 
      requestMappingTemplate: appsync.MappingTemplate.fromFile('resolvers/getherorequest.vtl'),
      responseMappingTemplate: appsync.MappingTemplate.fromFile('resolvers/getheroresponse.vtl'),
    });

    dataSource.createResolver({
      typeName: 'Query',
      fieldName: 'allHeroesByHeroName', 
      requestMappingTemplate: appsync.MappingTemplate.fromFile('resolvers/allheroesbyheronamerequest.vtl'),
      responseMappingTemplate: appsync.MappingTemplate.fromFile('resolvers/allheroesbyheronameresponse.vtl'),
    });

    dataSource.createResolver({
      typeName: 'Query',
      fieldName: 'allHeroesByPowers', 
      requestMappingTemplate: appsync.MappingTemplate.fromFile('resolvers/allheroesbypowersrequest.vtl'),
      responseMappingTemplate: appsync.MappingTemplate.fromFile('resolvers/allheroesbypowersresponse.vtl'),
    });

    dataSource.createResolver({
      typeName: 'Query',
      fieldName: 'allHeroes',
      requestMappingTemplate: appsync.MappingTemplate.fromFile('resolvers/allheroesrequest.vtl'),
      responseMappingTemplate: appsync.MappingTemplate.fromFile('resolvers/allheroesresponse.vtl'),
     });

    dataSource.createResolver({
      typeName: 'Mutation',
      fieldName: 'deleteHero',
      requestMappingTemplate: appsync.MappingTemplate.fromFile('resolvers/deleteherorequest.vtl'),
      responseMappingTemplate: appsync.MappingTemplate.fromFile('resolvers/deleteheroresponse.vtl'),
    });

    dataSource.createResolver({
      typeName: 'Mutation',
      fieldName: 'updateHero',
      requestMappingTemplate: appsync.MappingTemplate.fromFile('resolvers/updateherorequest.vtl'),
      responseMappingTemplate: appsync.MappingTemplate.fromFile('resolvers/updateheroresponse.vtl'),
    });

    dataSource.createResolver({
      typeName: 'Mutation',
      fieldName: 'addHero',
      requestMappingTemplate: appsync.MappingTemplate.fromFile('resolvers/addherorequest.vtl'),
      responseMappingTemplate: appsync.MappingTemplate.fromFile('resolvers/addheroresponse.vtl'),
    });

    // Output the GraphQL API endpoint and API Key for reference on client app
    new cdk.CfnOutput(this, 'GraphQLAPIEndpoint', {
      value: api.graphqlUrl,
      exportName: 'GraphQLAPIEndpoint'
    });

    new cdk.CfnOutput(this, 'GraphQLAPIKey', {
      value: api.apiKey || '',
      exportName: 'GraphQLAPIKey'
    });
  }
}

module.exports = { CdkStack }
