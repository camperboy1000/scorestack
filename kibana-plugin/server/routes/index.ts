import { schema } from '@kbn/config-schema';
import { IRouter } from 'kibana/server';

import { CheckAttributes } from '../../common';

interface Attribute {
  [index: string]: string;
}

export function defineRoutes(router: IRouter) {
  router.get(
    {
      path: '/api/scorestack/attribute',
      validate: false,
    },
    async (context, request, response) => {
      // Connect to Elasticsearch with the requesting user's permissions
      const client = context.core.elasticsearch.client.asCurrentUser;

      // All attributes will be returned in a single object
      const checks: CheckAttributes = {};

      // Determine how many attribute documents there are
      const {
        body: { count },
      } = await client.count({
        index: 'attrib_*',
      });

      // Get all the attribute documents
      const searchResults = await client.search({
        index: 'attrib_*',
        size: count,
      });

      // Add each attribute to the response
      for (const check of searchResults.body.hits.hits) {
        // Parse the document ID to determine the group
        // TODO: don't rely on parsing the document ID or index ID to determine the group, or ensure that unsafe characters are filtered from group names and check names
        const group = check._id.split('-').slice(-1)[0];

        // Set up the checks object to receive the attributes in the right spot
        if (group in checks === false) {
          checks[group] = {};
        }
        if (check._id in checks[group] === false) {
          // Add check name
          const checkDoc = await client.get({
            id: check._id,
            index: 'checks',
            _source_includes: 'name',
          });
          checks[group][check._id] = {
            attributes: {},
            name: checkDoc.body._source.name,
          };
        }

        // Add attribute contents
        checks[group][check._id].attributes = Object.assign(
          checks[group][check._id].attributes,
          check._source
        );
      }

      return response.ok({
        body: checks,
      });
    }
  );

  router.post(
    {
      path: '/api/scorestack/attribute/{id}/{name}',
      validate: {
        params: schema.object({
          id: schema.string(),
          name: schema.string(),
        }),
        body: schema.object({
          value: schema.string(),
        }),
      },
    },

    async (context, request, response) => {
      // Connect to Elasticsearch with the context of the current request
      const client = context.core.elasticsearch.client.asCurrentUser;

      // Parse the group from the ID
      // TODO: don't rely on parsing the document ID or index ID to determine the group, or ensure that unsafe characters are filtered from group names and check names
      const group = request.params.id.split('-').slice(-1);

      // Make sure the group's index exists
      const attribIndices = await client.indices.get({
        index: `attrib_*_${group}`,
        expand_wildcards: 'open',
      });

      if (Object.keys(attribIndices).length === 0) {
        return response.notFound({
          body: {
            message: `Attributes for group "${group}" either don't exist or you do not have access to them`,
          },
        });
      }

      // Check each attribute index for the attribute we are overwriting
      for (const attribIndex of Object.keys(attribIndices)) {
        // Try to get the attribute document for the index
        const attribDoc = await client.get({
          id: request.params.id,
          index: attribIndex,
        });

        // If the attribute exists in the document, update the document with the new value
        if (request.params.name in attribDoc.body._source) {
          const newAttrib: Attribute = {};
          newAttrib[request.params.name] = request.body.value;
          await client.update({
            id: request.params.id,
            index: attribIndex,
            body: {
              doc: newAttrib,
            },
          });

          return response.ok();
        }
      }

      // If we fall through to here, the attribute was not found
      return response.notFound({
        body: {
          message: `Attribute "${request.params.name}" for check ID ${request.params.id} either doesn't exist or you do not have access to it`,
        },
      });
    }
  );
}
