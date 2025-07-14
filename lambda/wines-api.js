const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand, PutCommand, GetCommand, UpdateCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const dynamodb = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  const { httpMethod, path, pathParameters, body } = event;
  
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    // Handle CORS preflight
    if (httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: '',
      };
    }

    const tableName = process.env.DYNAMODB_WINES_TABLE;

    // GET /wines - List all wines
    if (httpMethod === 'GET' && path === '/wines') {
      const result = await dynamodb.send(new ScanCommand({
        TableName: tableName,
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.Items || []),
      };
    }

    // POST /wines - Create new wine
    if (httpMethod === 'POST' && path === '/wines') {
      const wineData = JSON.parse(body);
      
      const wine = {
        id: uuidv4(),
        ...wineData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await dynamodb.send(new PutCommand({
        TableName: tableName,
        Item: wine,
      }));

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(wine),
      };
    }

    // GET /wines/{id} - Get specific wine
    if (httpMethod === 'GET' && pathParameters?.id) {
      const result = await dynamodb.send(new GetCommand({
        TableName: tableName,
        Key: { id: pathParameters.id },
      }));

      if (!result.Item) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Wine not found' }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.Item),
      };
    }

    // PUT /wines/{id} - Update wine
    if (httpMethod === 'PUT' && pathParameters?.id) {
      const wineData = JSON.parse(body);
      
      const result = await dynamodb.send(new UpdateCommand({
        TableName: tableName,
        Key: { id: pathParameters.id },
        UpdateExpression: 'SET #name = :name, vintage = :vintage, varietal = :varietal, region = :region, price = :price, description = :description, tastingNotes = :tastingNotes, inStock = :inStock, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#name': 'name',
        },
        ExpressionAttributeValues: {
          ':name': wineData.name,
          ':vintage': wineData.vintage,
          ':varietal': wineData.varietal,
          ':region': wineData.region,
          ':price': wineData.price,
          ':description': wineData.description,
          ':tastingNotes': wineData.tastingNotes,
          ':inStock': wineData.inStock,
          ':updatedAt': new Date().toISOString(),
        },
        ReturnValues: 'ALL_NEW',
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.Attributes),
      };
    }

    // DELETE /wines/{id} - Delete wine
    if (httpMethod === 'DELETE' && pathParameters?.id) {
      await dynamodb.send(new DeleteCommand({
        TableName: tableName,
        Key: { id: pathParameters.id },
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Wine deleted successfully' }),
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Route not found' }),
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: error.message }),
    };
  }
};
