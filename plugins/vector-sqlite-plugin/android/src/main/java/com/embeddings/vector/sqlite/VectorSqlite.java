package com.embeddings.vector.sqlite;

import com.getcapacitor.Logger;

public class VectorSqlite {

    public String echo(String value) {
        Logger.info("Echo", value);
        return value;
    }
}
