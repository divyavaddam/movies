const express = require("express");
const app = express();
app.use(express.json());
module.exports = app;
const path = require("path");
const dbPath = path.join(__dirname, "moviesData.db");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
const convertMovieTableDBObjectToResponseObject = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};
const convertDirectorTableDBObjectToResponseObject = (dbObject) => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  };
};
const convertArray = (dbObject) => {
  return {
    movieName: dbObject.movie_name,
  };
};
//GET MOVIES API
app.get("/movies/", async (request, response) => {
  const getMoviesQuery = `
    SELECT 
      *
    FROM 
      movie 
    ORDER BY 
      movie_id;
    `;
  const moviesArray = await db.all(getMoviesQuery);
  response.send(moviesArray.map((item) => convertArray(item)));
});
// POST MOVIE API
app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const addMovieQuery = `
  INSERT INTO 
    movie(director_id,movie_name,lead_actor)
  VALUES
    (${directorId},'${movieName}','${leadActor}');
  `;
  await db.run(addMovieQuery);
  response.send("Movie Successfully Added");
});
// GET MOVIE API
app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `
  SELECT * FROM movie WHERE movie_id=${movieId};
  `;
  const movie = await db.get(getMovieQuery);
  response.send(convertMovieTableDBObjectToResponseObject(movie));
});
app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const updateMovieQuery = `
  UPDATE 
    movie 
  SET
    director_id=${directorId},
    movie_name='${movieName}',
    lead_actor='${leadActor}'
  WHERE 
    movie_id=${movieId};
  `;
  await db.run(updateMovieQuery);
  response.send("Movie Details Updated");
});
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteQuery = `
  DELETE FROM movie 
  WHERE movie_id=${movieId};
  `;
  await db.run(deleteQuery);
  response.send("Movie Removed");
});
//GET DIRECTORS API
app.get("/directors/", async (request, response) => {
  const getDirectorsQuery = `
    SELECT 
      *
    FROM 
      director 
    ORDER BY 
      director_id;
    `;
  const directorsArray = await db.all(getDirectorsQuery);
  response.send(
    directorsArray.map((item) =>
      convertDirectorTableDBObjectToResponseObject(item)
    )
  );
});
//GET MOVIE NAMES DIRECTED BY A SPECIFIC DIRECTOR API
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getMovieNamesQuery = `
  SELECT movie.movie_name
  FROM movie JOIN director ON movie.director_id=director.director_id
  WHERE director.director_id=${directorId};
  `;
  const movieArray = await db.all(getMovieNamesQuery);
  response.send(movieArray.map((item) => convertArray(item)));
});
