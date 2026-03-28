const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RTDMS API',
      version: '1.0.0',
      description:
        'Real-Time Farm-to-Market Delivery Management System for Perishable Agricultural Produce — REST API documentation. Supports Dispatcher, Delivery Agent, and Farmer roles with JWT authentication and real-time WebSocket tracking.',
      contact: {
        name: 'Pelumi',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '665a1b2c3d4e5f6a7b8c9d0e' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john@example.com' },
            role: {
              type: 'string',
              enum: ['admin', 'rider', 'customer'],
              example: 'customer',
            },
            phone: { type: 'string', example: '08012345678' },
            isAvailable: { type: 'boolean', example: true },
            currentLocation: {
              type: 'object',
              properties: {
                lat: { type: 'number', example: 6.5244 },
                lng: { type: 'number', example: 3.3792 },
              },
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Delivery: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '665a1b2c3d4e5f6a7b8c9d0e' },
            trackingId: { type: 'string', example: 'RTDMS-A1B2C3' },
            customer: { $ref: '#/components/schemas/User' },
            rider: { $ref: '#/components/schemas/User' },
            pickupAddress: {
              type: 'string',
              example: '12 Marina Road, Lagos Island',
            },
            pickupCoords: {
              type: 'object',
              properties: {
                lat: { type: 'number', example: 6.4541 },
                lng: { type: 'number', example: 3.4218 },
              },
            },
            deliveryAddress: {
              type: 'string',
              example: '45 Allen Avenue, Ikeja',
            },
            deliveryCoords: {
              type: 'object',
              properties: {
                lat: { type: 'number', example: 6.6018 },
                lng: { type: 'number', example: 3.3515 },
              },
            },
            packageDescription: {
              type: 'string',
              example: 'Standard parcel - electronics',
            },
            status: {
              type: 'string',
              enum: ['pending', 'assigned', 'in-transit', 'delivered'],
              example: 'pending',
            },
            statusHistory: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  timestamp: { type: 'string', format: 'date-time' },
                },
              },
            },
            currentLocation: {
              type: 'object',
              properties: {
                lat: { type: 'number' },
                lng: { type: 'number' },
              },
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Error message' },
          },
        },
      },
    },
  },
  apis: ['./src/features/**/*.routes.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
