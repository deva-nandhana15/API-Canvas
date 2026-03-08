// ============================================================
// flaskMongoJWT.js — Flask + MongoDB + JWT Template
// ============================================================
// Generates a production-ready Flask route handler with
// PyMongo (MongoDB) integration and optional JWT auth via
// flask_jwt_extended. Used by the Code Generator page.
// ============================================================

export function generateFlaskMongoJWT({
  method,
  path,
  bodyFields,
  authRequired,
}) {
  // Parse comma-separated body fields into an array
  const fields = bodyFields
    ? bodyFields
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean)
    : [];

  const flaskMethod = method === "DELETE" ? "DELETE" : method;

  // Convert Express-style :param to Flask-style <param>
  const routeDecorator = path.replace(/:(\w+)/g, "<$1>");

  return `from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
${
  authRequired
    ? "from flask_jwt_extended import jwt_required, get_jwt_identity"
    : ""
}
import os

app = Flask(__name__)
app.config['MONGO_URI'] = os.environ.get(
  'MONGO_URI', 'mongodb://localhost:27017/mydb'
)
mongo = PyMongo(app)

@app.route('${routeDecorator}', 
  methods=['${flaskMethod}'])
${authRequired ? "@jwt_required()\n" : ""}def handle_${path
    .replace(/\//g, "_")
    .replace(/:/g, "")
    .replace(/^_/, "")}():
    try:
        ${
          fields.length > 0
            ? `data = request.get_json()
        ${fields.map((f) => `${f} = data.get('${f}')`).join("\n        ")}`
            : "# No request body needed"
        }
        ${authRequired ? "current_user = get_jwt_identity()" : ""}

        # TODO: Add your MongoDB logic here
        # Example: result = mongo.db.collection
        #   .find_one({'_id': ObjectId(id)})

        return jsonify({
            'success': True,
            'message': '${method} ${path} successful'
        }), ${method === "POST" ? "201" : "200"}

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)`;
}
