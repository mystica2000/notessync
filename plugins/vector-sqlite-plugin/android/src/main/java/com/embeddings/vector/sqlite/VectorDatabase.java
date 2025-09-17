package com.embeddings.vector.sqlite;

import android.content.Context;
import android.database.Cursor;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import io.requery.android.database.sqlite.SQLiteCustomExtension;
import io.requery.android.database.sqlite.SQLiteDatabase;
import io.requery.android.database.sqlite.SQLiteDatabaseConfiguration;
import io.requery.android.database.sqlite.SQLiteOpenHelper;

public class VectorDatabase extends SQLiteOpenHelper {

  private static final String TAG = "VEC";
  private static final String DB_NAME = "vector.db";
  private static final int DB_VERSION = 1;

  public VectorDatabase(Context context) {
    super(context, DB_NAME, null, DB_VERSION);
  }

  @Override
  public void onCreate(SQLiteDatabase db) {
    checkVersion(db);
    createTableForVectorEmbeddings(db);
  }

  @Override
  public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
    db.execSQL("DROP TABLE IF EXISTS vec_documents");
    onCreate(db);
  }

  @Override
  public void close() {
    super.close();
  }

  @Override
  protected SQLiteDatabaseConfiguration createConfiguration(final String path, final int openFlags) {
  final SQLiteDatabaseConfiguration config = super.createConfiguration(path, openFlags);
  config.customExtensions.add(new SQLiteCustomExtension("vec0", "sqlite3_vec_init"));
  return config;
  }

  public boolean insertDocument(String content, float[] embedding) {
    SQLiteDatabase db = getWritableDatabase();

    StringBuilder embeddingStr = new StringBuilder("[");
    for (int i = 0; i < embedding.length; i++) {
      embeddingStr.append(embedding[i]);
      if (i < embedding.length - 1) embeddingStr.append(",");
    }
    embeddingStr.append("]");
    long timestamp = System.currentTimeMillis();



    try {
      db.execSQL("INSERT INTO vec_documents(content, embedding, timestamp) VALUES (?,  ?, ?)", new Object[]{ content, embeddingStr.toString(), timestamp});
      Log.d(TAG, "Document inserted successfully");
      return true;
    } catch (Exception e) {
      Log.d(TAG,"Failed to insert document: " + e.getMessage());
      e.printStackTrace();
    }
    return false;
  }

  public void checkVersion(SQLiteDatabase db) {
    Cursor cursor = null;
    try {
      cursor = db.rawQuery("SELECT sqlite_version(), vec_version()", null);
      if (cursor.moveToFirst()) {
        String sqlite_version = cursor.getString(0);
        String vector_version = cursor.getString(1);
        Log.d(TAG, "SQLite Version: " + sqlite_version + ", Vector Version: " + vector_version);
      }
    } catch (Exception e) {
      Log.e(TAG, "Failed to check versions: " + e.getMessage());
    } finally {
      if (cursor != null) {
        cursor.close();
      }
    }
  }

  public boolean createTableForVectorEmbeddings(SQLiteDatabase db) {
    try {
      db.execSQL("CREATE VIRTUAL TABLE IF NOT EXISTS vec_documents USING vec0(id INTEGER PRIMARY KEY AUTOINCREMENT, embedding FLOAT[768], content TEXT, timestamp INTEGER NOT NULL)");

      Log.d(TAG, "Vector TABLE - Created if not exists successfully");
      return true;
    } catch (Exception e) {
      Log.d(TAG, "Failed to initialize Vector TABLE " + e.getMessage());
      e.printStackTrace();
      return false;
    }
  }

  public void test() {
    SQLiteDatabase db = getWritableDatabase();
    Cursor cursor = db.rawQuery("SELECT COUNT(*) FROM vec_documents", null);
    if (cursor.moveToFirst()) {
      int count = cursor.getInt(0);
      Log.d(TAG, "Document count: " + count);
      cursor.close();
    }
  }

  public PaginationResult findRow(Long lastId, int limit) {

    Cursor cursorResult = null;
    PaginationResult result = new PaginationResult();
    SQLiteDatabase db = null;

    try {
    String sql;
    Object[] args;


    if (lastId > 0) {
      sql = "SELECT id, content, timestamp  FROM vec_documents WHERE id < ? ORDER BY id DESC LIMIT ?";
      // Pass both the lastId and the limit
      args = new Object[]{ lastId, limit + 1 };
    } else {
      sql = "SELECT id, content, timestamp  FROM vec_documents ORDER BY id DESC LIMIT ?";
      args = new String[]{String.valueOf(limit + 1)};
    }

    db = this.getReadableDatabase();

    cursorResult = db.rawQuery(sql, args);

    Long newLastRowId = null;
    int count = 0;

    while(cursorResult.moveToNext()) {

      if (count >= limit) {
        // We found an extra row, so there are more items
        result.hasMore = true;
        break; // Exit the loop
      }

      int id = cursorResult.getInt(0);
      String content = cursorResult.getString(1);
      long timestamp = cursorResult.getLong(2);

      VectorResult item = new VectorResult(id, content, timestamp);
      result.results.add(item);


      count++;
      newLastRowId = cursorResult.getLong(0);
    }

    result.nextCursor = result.hasMore ? newLastRowId : -1;

  } catch (Exception e) {
    result.success = false;
    result.error = e.getMessage();
  } finally {
    if (cursorResult != null) {
      cursorResult.close();
    }
    if (db != null) {
      db.close();  // Close the database connection
      }
  }

    return result;
  }

  public List<VectorSearchResult> searchDocuments(float[] query, int limit) {
    List<VectorSearchResult> results = new ArrayList<>();
    SQLiteDatabase db = null;
    Cursor cursor = null;

    try {

      db = getReadableDatabase();

      String sqlQuery = "SELECT id, content, timestamp, distance from vec_documents WHERE " + "embedding MATCH ? " + "ORDER BY distance " + "LIMIT ?";

      cursor = db.rawQuery(sqlQuery, new String[] {Arrays.toString(query), String.valueOf(3) });

      while (cursor.moveToNext()) {
        int id = cursor.getInt(0);
        String content = cursor.getString(1);
        long timestamp = cursor.getLong(2);
        float distance = cursor.getFloat(3);

        results.add(new VectorSearchResult(id, content, timestamp, distance));
      }

      Log.d(TAG, "Found " + results.size() + " similar documents");

    } catch (Exception e) {
      e.printStackTrace();
    } finally {
      if (cursor != null) {
        cursor.close();
      }
      if (db != null) {
        db.close();
      }
    }

    return results;

  }

}

class VectorSearchResult {
  private int id;
  private String content;
  private long timestamp;
  private float distance;

  public VectorSearchResult(int id, String content, long timestamp, float distance) {
    this.id = id;
    this.content = content;
    this.distance = distance;
    this.timestamp = timestamp;
  }

  public int getId() { return id; }
  public String getContent() { return content; }
  public float getDistance() { return distance; }
  public long getTimestamp() { return timestamp; }
}

class PaginationResult {
  public boolean success;
  public String error;
  public List<VectorResult> results;
  public boolean hasMore;
  public Long nextCursor;

  public PaginationResult() {
    this.results = new ArrayList<>();
    this.success = true;
  }
}

// Simple data class without distance
class VectorResult {
  private int id;
  private String content;
  private long timestamp;

  public VectorResult(int id, String content, long timestamp) {
    this.id = id;
    this.content = content;
    this.timestamp = timestamp;
  }

  public int getId() { return id; }
  public String getContent() { return content; }
  public long getTimestamp() { return timestamp; }
}

