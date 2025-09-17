package com.embeddings.vector.sqlite;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.List;

@CapacitorPlugin(name = "VectorSqlite")
public class VectorSqlitePlugin extends Plugin {

    private VectorSqlite implementation = new VectorSqlite();
    private VectorDatabase vectorDb;

    @PluginMethod
    public void echo(PluginCall call) {
        String value = call.getString("value");

        JSObject ret = new JSObject();
        ret.put("value", implementation.echo(value));
        call.resolve(ret);
    }

    @PluginMethod
    public void initialize(PluginCall call) {
      try {

        if (vectorDb == null) {
        vectorDb = new VectorDatabase(getContext().getApplicationContext());

        vectorDb.test();
        }


        call.resolve();
      } catch (Exception e) {
        e.printStackTrace();
      }
    }

    @PluginMethod
    public void insert(PluginCall call) {
      String content = call.getString("content");
      JSArray embeddingArray = call.getArray("embedding");

      if (content == null || embeddingArray == null) {
        call.reject("INVALID_PARAMS", "Content and embedding are required");
        return;
      }

      try {
        float[] embedding = new float[embeddingArray.length()];
        for (int i = 0; i < embeddingArray.length(); i++) {
          embedding[i] = (float) embeddingArray.getDouble(i);
        }

        boolean result = vectorDb.insertDocument(content, embedding);

        JSObject ret = new JSObject();
        ret.put("success", result);
        ret.put("message", result ? "Document inserted successfully" : "Failed to insert document");

        call.resolve(ret);

      } catch (Exception e) {
        call.reject("INSERT_ERROR ", e.getMessage());
      }

    }

    @PluginMethod
    public void query(PluginCall call) {
      if (vectorDb == null) {
        JSObject ret = new JSObject();
        ret.put("result", false);
        call.resolve(ret);
        return;
      }

      try {
        JSArray searchParams = call.getArray("search");

        if (searchParams == null) {
          JSObject ret = new JSObject();
          ret.put("result", false);
          call.resolve(ret);
          return;
        }

        float[] embedding = new float[searchParams.length()];
        for (int i = 0; i < searchParams.length(); i++) {
          embedding[i] = (float) searchParams.getDouble(i);
        }


        List<VectorSearchResult> results = vectorDb.searchDocuments(embedding, 3);

        JSObject ret = new JSObject();
        ret.put("result", results != null && !results.isEmpty());

        if (results != null) {
          JSArray resultsArray = new JSArray();
          for (VectorSearchResult result : results) {
            JSObject resultObj = new JSObject();
            resultObj.put("id", result.getId());
            resultObj.put("content", result.getContent());
            resultObj.put("timestamp", result.getTimestamp());
            resultObj.put("distance", result.getDistance());
            resultsArray.put(resultObj);
          }
          ret.put("data", resultsArray);
          ret.put("count", results.size());
        }

        call.resolve(ret);

      } catch (Exception e) {
        throw new RuntimeException(e);
      }

    }

    @PluginMethod
    public void getWithPagination(PluginCall call) {

      if (vectorDb == null) {
        JSObject ret = new JSObject();
        ret.put("result", false);
        call.resolve(ret);
        return;
      }

      try {

        Integer limit = call.getInt("limit", 10);
        Long lastId = call.getInt("cursor", 0).longValue();


        PaginationResult dbResult = vectorDb.findRow(lastId, limit);
        if (!dbResult.success) {
          call.reject("Database error: " + dbResult.error);
          return;
        }

        // Convert the result to JS format
        JSObject result = new JSObject();
        JSArray resultsArray = new JSArray();

        for (VectorResult item : dbResult.results) {
          JSObject jsItem = new JSObject();
          jsItem.put("id", item.getId());
          jsItem.put("content", item.getContent());
          jsItem.put("timestamp", item.getTimestamp());
          resultsArray.put(jsItem);
        }

        result.put("results", resultsArray);
        result.put("hasMore", dbResult.hasMore);
        result.put("nextCursor", dbResult.nextCursor);

        call.resolve(result);

      } catch (Exception e) {
        throw new RuntimeException(e);
      }
    }
}
