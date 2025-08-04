"use server";

import sqlite3 from "sqlite3";
import fs from "fs";
import path from "path";

const db = new sqlite3.Database('./data.sqlite');

export async function seed() {
  const schemaSql = fs.readFileSync(path.resolve(__dirname, "./sample-model.sql"), "utf8");
  const dataSql = fs.readFileSync(path.resolve(__dirname, "./sample-data.sql"), "utf8");

  return new Promise<void>((resolve, reject) => {
    db.serialize(() => {
      db.exec(schemaSql, (err) => {
        if (err) {
          console.error("Error running schema:", err);
          reject(err);
          return;          
        }
        db.exec(dataSql, (err) => {
          if (err) {
            console.error("Error running data:", err);
            reject(err);
            return;
          }
          resolve();
        });
      });
    });
  });
}

export async function execute(sql: string) {
  return await new Promise((resolve, reject) => {
    try {
      //   db.all("SELECT 'c'.'name', COUNT('o'.'id') FROM 'order' 'o' JOIN 'customer' 'c' ON 'o'.'customerid' = 'c'.'id' GROUP BY 'c'.'name' ORDER BY COUNT('o'.'id') DESC LIMIT 1", (error, result) => {
      db.all(sql, (error, result) => {
        if (error) {
          console.log({ error });
          resolve(JSON.stringify(error));
        }

        console.log({ result });
        resolve(result);
      });
    } catch (e) {
      console.log(e);
      reject(e);
    }
  });
}