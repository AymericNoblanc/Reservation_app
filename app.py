from flask import Flask, jsonify, request, render_template, make_response, redirect, render_template_string
import psycopg2
from psycopg2 import sql
from datetime import datetime, timedelta
from flask_cors import CORS
import json
from werkzeug.security import generate_password_hash, check_password_hash
import uuid

app = Flask(__name__)
CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

# Simuler une base de données
users_db = {}

# Fonction pour se connecter à la base de données PostgreSQL
def get_db_connection():

    with open('./secret.json', 'r') as f:
        data = json.load(f)

    conn = psycopg2.connect(
        host=data.get("host"),
        port=data.get("port"),
        dbname=data.get("dbname"),
        user=data.get("user"),
        password=data.get("password"),
        sslmode=data.get("sslmode")
    )
    return conn

def check_auth_token(token):

    if token:

        conn = get_db_connection()
        cur = conn.cursor()

        query = sql.SQL('''
            SELECT 
                d.name
            FROM 
                cookie c
            JOIN 
                credential cr on c.credential_id = cr.id
            JOIN 
	            domaine d on cr.domaine_id = d.id
            WHERE
                token = %s AND expires_at > NOW()
        ''')
        cur.execute(query, (token, ))
        row = cur.fetchone()

        cur.close()
        conn.close()

        # Vérifier si l'utilisateur existe
        if row is not None:
            return row[0]

    return False

@app.route('/login', methods=['POST'])
def loginPOST():
    data = request.get_json()
    email = data.get('email').lower()
    password = data.get('password')

    conn = get_db_connection()
    cur = conn.cursor()

    query = sql.SQL('''
        SELECT 
            c.password_hash, d.name, c.user_id, c.id
        FROM 
            credential c
        JOIN 
            domaine d on c.domaine_id = d.id
        WHERE
            c.email = %s
    ''')
    cur.execute(query, (email, ))
    rows = cur.fetchall()

    # Vérifier si l'utilisateur existe
    if len(rows) == 0:
        cur.close()
        conn.close()
        return jsonify({"message": "User not found"}), 400

    # Vérifier le mot de passe
    if not check_password_hash(rows[0][0], password):
        cur.close()
        conn.close()
        return jsonify({"message": "Invalid password"}), 400

    # Générer un UUID pour le cookie
    token = str(uuid.uuid4())
    expires_at = datetime.now() + timedelta(weeks=52)

    # Mettre à jour dans la "base de données"
    query = sql.SQL('''
        INSERT INTO
            cookie (credential_id, token, expires_at)
        VALUES
            (%s, %s, %s)
    ''')
    cur.execute(query, (rows[0][3], token, expires_at))
    conn.commit()

    query = sql.SQL('''
        INSERT INTO
            log (credential_id, request_type, request_data)
        VALUES
            (%s, 'connexion_login', %s)
    ''')
    cur.execute(query, (rows[0][3], token ))
    conn.commit()

    cur.close()
    conn.close()

    # Définir un cookie avec l'UUID
    response = make_response(jsonify({"domaine": rows[0][1]}))
    response.set_cookie('authToken', token, httponly=False, max_age=60 * 60 * 24 * 7 * 52)

    return response, 200

@app.route('/signup', methods=['POST'])
def signupPOST():
    data = request.get_json()
    email = data.get('email').lower()
    password = data.get('password')
    firstname = data.get('firstname')
    lastname = data.get('lastname')
    domaine = data.get('domaine')

    conn = get_db_connection()
    cur = conn.cursor()

    query = sql.SQL('''
        SELECT 
            *
        FROM 
            credential
        WHERE
            email = %s
    ''')
    cur.execute(query, (email, ))
    rows = cur.fetchall()

    # Vérifier si l'email existe déjà
    if len(rows) != 0:
        cur.close()
        conn.close()
        return "Email déjà utilisé.", 400

    conn = get_db_connection()
    cur = conn.cursor()

    query = sql.SQL('''
        SELECT 
            *
        FROM 
            domaine
        WHERE
            code = %s
    ''')
    cur.execute(query, (domaine, ))
    rows = cur.fetchall()

    # Vérifier si le domaine existe
    if len(rows) == 0:
        cur.close()
        conn.close()
        return "Domaine non trouvé.", 400

    domaine_id = rows[0][0]
    domaine_name = rows[0][1]
    domaineUser = domaine_name + '_user'

    # Hacher le mot de passe et l'enregistrer
    hashed_password = generate_password_hash(password)

    query = sql.SQL('''
        INSERT INTO
            credential (email, password_hash, domaine_id)
        VALUES
            (%s, %s, %s)
    ''')
    cur.execute(query, (email, hashed_password, domaine_id))
    conn.commit()

    query = sql.SQL('''
        SELECT
            id, user_id
        FROM
            credential
        WHERE
            email = %s
    ''')
    cur.execute(query, (email, ))
    conn.commit()
    row = cur.fetchone()

    credential_id = row[0]
    user_id = row[1]

    initial = str(firstname[0]) + str(lastname[0])

    query = sql.SQL('''
        INSERT INTO
            {domaine_user} (id, firstname, lastname, initial)
        VALUES
            (%s, %s, %s, %s)
    ''').format(
        domaine_user=sql.Identifier(domaineUser)
    )
    cur.execute(query, (user_id, firstname.replace("'", "''"), lastname.replace("'", "''"), initial))
    conn.commit()

    # Générer un UUID pour le cookie
    token = str(uuid.uuid4())
    expires_at = datetime.now() + timedelta(weeks=52)

    # Mettre à jour dans la "base de données"
    query = sql.SQL('''
            INSERT INTO
                cookie (credential_id, token, expires_at)
            VALUES
                (%s, %s, %s)
        ''')
    cur.execute(query, (credential_id, token, expires_at))
    conn.commit()

    query = sql.SQL('''
        INSERT INTO
            log (credential_id, request_type, request_data)
        VALUES
            (%s, 'signup', %s)
    ''')
    cur.execute(query, (credential_id, token))
    conn.commit()

    cur.close()
    conn.close()

    # Définir un cookie avec l'UUID
    response = make_response(jsonify({"domaine": domaine_name}))
    response.set_cookie('authToken', token, httponly=False, max_age=60 * 60 * 24 * 7 * 52)

    return response, 200

@app.route('/')
def home():

    return redirect('/login/')

@app.route('/healthcheck')
def healthcheck():
    return ('', 204)

@app.route('/login/')
def login():

    domaine = check_auth_token(request.cookies.get('authToken'))

    if domaine is not False:
        return redirect('/' + domaine)

    return render_template('login.html')

@app.route('/signup/')
def signup():

    domaine = check_auth_token(request.cookies.get('authToken'))

    if domaine is not False:
        return redirect('/' + domaine)

    domaine = request.args.get('domaine', default='', type=str)
    email = request.args.get('email', default='', type=str)
    return render_template('signup.html', domaine=domaine, email=email)

@app.route('/test/')
def home_test():

    if check_auth_token(request.cookies.get('authToken')) is not False:
        return render_template('test_app.html')

    return redirect('/login/')

@app.route('/noblanc/')
def home_noblanc():

    if check_auth_token(request.cookies.get('authToken')) is not False:
        return render_template('noblanc_app.html')

    return redirect('/login/')

@app.route('/teamsquare/')
def home_teamsquare():

    if check_auth_token(request.cookies.get('authToken')) is not False:
        return render_template('teamsquare_app.html')

    return redirect('/login/')

@app.route('/escalade/')
def home_escalade():

    if check_auth_token(request.cookies.get('authToken')) is not False:
        return render_template('escalade_app.html')

    return redirect('/login/')

#Route pour récupérer les informations de l'utilisateur connecté
@app.route('/find-cookie/<cookie>', methods=['GET'])
def get_user_from_cookie(cookie):
    conn = get_db_connection()
    cur = conn.cursor()

    query = sql.SQL('''
        SELECT 
            cr.user_id, cr.id
        FROM 
            cookie c
        JOIN 
            credential cr on c.credential_id = cr.id
        WHERE
            c.token = %s
    ''')
    cur.execute(query, (cookie, ))
    row = cur.fetchone()

    user = []
    user.append({
        "user_id": row[0]
    })

    query = sql.SQL('''
        INSERT INTO
            log (credential_id, request_type, request_data)
        VALUES
            (%s, 'connexion', %s)
    ''')
    cur.execute(query, (row[1], cookie))
    conn.commit()

    cur.close()
    conn.close()

    response = jsonify(user)
    response.headers.add('Access-Control-Allow-Origin', '*')

    return response

@app.route('/logout', methods=['POST'])
def cookie_logout():
    token = request.cookies.get('authToken')

    if token:

        conn = get_db_connection()
        cur = conn.cursor()

        query = sql.SQL('''
            SELECT 
                cr.id
            FROM 
                cookie c
            JOIN 
                credential cr on c.credential_id = cr.id
            WHERE
                c.token = %s
        ''')
        cur.execute(query, (token, ))
        row = cur.fetchone()

        query = sql.SQL('''
            DELETE
            FROM cookie
            WHERE token = %s
        ''')
        cur.execute(query, (token, ))
        conn.commit()

        query = sql.SQL('''
            INSERT INTO
                log (credential_id, request_type, request_data)
            VALUES
                (%s, 'deconnexion', %s)
        ''')
        cur.execute(query, (row[0], token))
        conn.commit()

        cur.close()
        conn.close()

    # Supprimer le cookie
    response = jsonify({"message": "Déconnexion réussie"})
    response.delete_cookie('authToken')
    return response

@app.route('/a8b7c59e/logs/')
def show_logs():
    conn = get_db_connection()
    cur = conn.cursor()

    # Exécution de la requête
    query = """
        SELECT email, d.name, 
               request_time AT TIME ZONE 'Europe/Paris' AS request_time, 
               request_type, request_data
        FROM log l
        JOIN credential c ON l.credential_id = c.id
        JOIN domaine d ON c.domaine_id = d.id
        WHERE request_time > current_date - interval '2' day
        ORDER BY request_time DESC;
        """
    cur.execute(query)
    logs = cur.fetchall()

    cur.close()
    conn.close()

    html_template = """
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Logs des Requêtes</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                        padding: 0;
                        background-color: #f4f4f9;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                        background-color: #fff;
                    }
                    table th, table td {
                        border: 1px solid #ccc;
                        padding: 8px;
                        text-align: left;
                    }
                    table th {
                        background-color: #2c3e50;
                        color: white;
                    }
                    table tr:nth-child(even) {
                        background-color: #f9f9f9;
                    }
                    h1 {
                        text-align: center;
                        color: #2c3e50;
                    }
                </style>
            </head>
            <body>
                <h1>Logs des Requêtes</h1>
                <table>
                    <thead>
                        <tr>
                            <th>Email</th>
                            <th>Domaine</th>
                            <th>Date et Heure</th>
                            <th>Type de Requête</th>
                            <th>Données</th>
                        </tr>
                    </thead>
                    <tbody>
                        {% for log in logs %}
                        <tr>
                            <td>{{ log[0] }}</td>
                            <td>{{ log[1] }}</td>
                            <td>{{ log[2] }}</td>
                            <td>{{ log[3] }}</td>
                            <td>{{ log[4] }}</td>
                        </tr>
                        {% endfor %}
                    </tbody>
                </table>
            </body>
            </html>
    """

    return render_template_string(html_template, logs=logs)

@app.route('/a8b7c59e/logs/connexion/')
def show_connexion_logs():
    conn = get_db_connection()
    cur = conn.cursor()

    # Exécution de la requête
    query = """
        SELECT email, d.name, 
               request_time AT TIME ZONE 'Europe/Paris' AS request_time, 
               request_type, request_data
        FROM log l
        JOIN credential c ON l.credential_id = c.id
        JOIN domaine d ON c.domaine_id = d.id
        WHERE request_time > current_date - interval '2' day
        AND request_type = 'connexion' OR request_type = 'connexion_login'
        ORDER BY request_time DESC;
        """
    cur.execute(query)
    logs = cur.fetchall()

    cur.close()
    conn.close()

    html_template = """
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Logs des Requêtes</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                        padding: 0;
                        background-color: #f4f4f9;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                        background-color: #fff;
                    }
                    table th, table td {
                        border: 1px solid #ccc;
                        padding: 8px;
                        text-align: left;
                    }
                    table th {
                        background-color: #2c3e50;
                        color: white;
                    }
                    table tr:nth-child(even) {
                        background-color: #f9f9f9;
                    }
                    h1 {
                        text-align: center;
                        color: #2c3e50;
                    }
                </style>
            </head>
            <body>
                <h1>Logs des Requêtes</h1>
                <table>
                    <thead>
                        <tr>
                            <th>Email</th>
                            <th>Domaine</th>
                            <th>Date et Heure</th>
                            <th>Type de Requête</th>
                            <th>Données</th>
                        </tr>
                    </thead>
                    <tbody>
                        {% for log in logs %}
                        <tr>
                            <td>{{ log[0] }}</td>
                            <td>{{ log[1] }}</td>
                            <td>{{ log[2] }}</td>
                            <td>{{ log[3] }}</td>
                            <td>{{ log[4] }}</td>
                        </tr>
                        {% endfor %}
                    </tbody>
                </table>
            </body>
            </html>
    """

    return render_template_string(html_template, logs=logs)

@app.route('/a8b7c59e/logs/signup/')
def show_signup_logs():
    conn = get_db_connection()
    cur = conn.cursor()

    # Exécution de la requête
    query = """
        SELECT email, d.name, 
               request_time AT TIME ZONE 'Europe/Paris' AS request_time, 
               request_type, request_data
        FROM log l
        JOIN credential c ON l.credential_id = c.id
        JOIN domaine d ON c.domaine_id = d.id
        WHERE request_time > current_date - interval '2' day
        AND request_type = 'signup'
        ORDER BY request_time DESC;
        """
    cur.execute(query)
    logs = cur.fetchall()

    cur.close()
    conn.close()

    html_template = """
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Logs des Requêtes</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                        padding: 0;
                        background-color: #f4f4f9;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                        background-color: #fff;
                    }
                    table th, table td {
                        border: 1px solid #ccc;
                        padding: 8px;
                        text-align: left;
                    }
                    table th {
                        background-color: #2c3e50;
                        color: white;
                    }
                    table tr:nth-child(even) {
                        background-color: #f9f9f9;
                    }
                    h1 {
                        text-align: center;
                        color: #2c3e50;
                    }
                </style>
            </head>
            <body>
                <h1>Logs des Requêtes</h1>
                <table>
                    <thead>
                        <tr>
                            <th>Email</th>
                            <th>Domaine</th>
                            <th>Date et Heure</th>
                            <th>Type de Requête</th>
                            <th>Données</th>
                        </tr>
                    </thead>
                    <tbody>
                        {% for log in logs %}
                        <tr>
                            <td>{{ log[0] }}</td>
                            <td>{{ log[1] }}</td>
                            <td>{{ log[2] }}</td>
                            <td>{{ log[3] }}</td>
                            <td>{{ log[4] }}</td>
                        </tr>
                        {% endfor %}
                    </tbody>
                </table>
            </body>
            </html>
    """

    return render_template_string(html_template, logs=logs)

#Route pour récupérer tous les travailleurs
@app.route('/<domaine>/users', methods=['GET'])
def get_users(domaine):
    conn = get_db_connection()
    cur = conn.cursor()

    domaineUser = domaine + '_user'

    query = sql.SQL('''
        SELECT 
            d.id,
            d.firstname,
            d.lastname,
            d.color,
            d.initial,
            c.email
        FROM 
            {domaine_user} d
        JOIN 
            credential c on d.id = c.user_id
    ''').format(
        domaine_user=sql.Identifier(domaineUser)
    )
    cur.execute(query)
    rows = cur.fetchall()

    users = []
    for row in rows:
        users.append({
            "id": row[0],
            "firstname": row[1],
            "lastname": row[2],
            "color": row[3],
            "initial": row[4],
            "email": row[5]
        })

    cur.close()
    conn.close()

    response = jsonify(users)
    response.headers.add('Access-Control-Allow-Origin', '*')

    return response

#Route pour récupérer tous les sites
@app.route('/<domaine>/sites', methods=['GET'])
def get_sites(domaine):
    conn = get_db_connection()
    cur = conn.cursor()

    domaineSite = domaine + '_site'

    query = sql.SQL('''
        SELECT 
            id,
            name,
            display_name
        FROM 
            {domaine_site}
    ''').format(
        domaine_site=sql.Identifier(domaineSite)
    )
    cur.execute(query)
    rows = cur.fetchall()

    sites = []
    for row in rows:
        sites.append({
            "id": row[0],
            "name": row[1],
            "display_name": row[2]
        })

    cur.close()
    conn.close()

    response = jsonify(sites)
    response.headers.add('Access-Control-Allow-Origin', '*')

    return response

#Lister toutes les réservations pour un site pour une semaine donnée
@app.route('/<domaine>/reservations/week', methods=['GET'])
def get_reservations_in_a_week(domaine):
    start_date = request.args.get('start_date')
    end_date = (datetime.strptime(start_date, '%Y-%m-%d') + timedelta(days=5)).strftime('%Y-%m-%d')

    conn = get_db_connection()
    cur = conn.cursor()

    domaineReservation = domaine + '_reservation'
    domaineUser = domaine + '_user'

    query = sql.SQL('''
        SELECT 
            r.date, 
            u.id AS user_id,
            r.site_id
        FROM 
            {domaine_reservation} r
        JOIN 
            {domaine_user} u ON r.user_id = u.id
        WHERE 
            r.date BETWEEN %s AND %s
        ORDER BY 
            r.date
    ''').format(
        domaine_reservation=sql.Identifier(domaineReservation),
        domaine_user=sql.Identifier(domaineUser)
    )
    cur.execute(query, (start_date, end_date))
    rows = cur.fetchall()

    reservations = []
    for row in rows:
        reservations.append({
            "date": row[0].strftime('%Y-%m-%d'),
            "user_id": row[1],
            "site_id": row[2]
        })

    cur.close()
    conn.close()

    response = jsonify(reservations)
    response.headers.add('Access-Control-Allow-Origin', '*')

    return response

#Route pour créer une réservation
@app.route('/<domaine>/reservations', methods=['POST'])
def create_reservation(domaine):
    user_id = request.json['user_id']
    site_id = request.json['site_id']
    date = request.json['date']

    conn = get_db_connection()
    cur = conn.cursor()

    domaineReservation = domaine + '_reservation'

    # Vérifier si une réservation existe pour cet employé à cette date
    query = sql.SQL('''
        SELECT *
        FROM 
           {domaine_reservation}
        WHERE
            user_id = %s
            AND date = %s
            AND site_id = %s
    ''').format(
        domaine_reservation=sql.Identifier(domaineReservation)
    )
    cur.execute(query, (user_id, date, site_id ))
    existing_reservation = cur.fetchone()

    if existing_reservation:
        cur.close()
        conn.close()

        response = jsonify({"message": "Reservation  already exists for this worker on this date"})
        response.headers.add('Access-Control-Allow-Origin', '*')

        return response, 400

    # Créer la réservation
    query = sql.SQL('''
        INSERT INTO
            {domaine_reservation} (user_id, site_id, date)
        VALUES
            (%s, %s, %s)
    ''').format(
        domaine_reservation=sql.Identifier(domaineReservation)
    )
    cur.execute(query, (user_id, site_id, date))
    conn.commit()

    queryLog = sql.SQL('''
        INSERT INTO log (credential_id, request_type, request_data)
        VALUES (
            (SELECT id FROM credential WHERE user_id = %s),
            'Création réservation',
            %s
        )
    ''')
    cur.execute(queryLog, (user_id, cur.mogrify(query, (user_id, site_id, date)).decode('utf-8')))
    conn.commit()

    cur.close()
    conn.close()

    response = jsonify({"message": "Reservation created"})
    response.headers.add('Access-Control-Allow-Origin', '*')

    return response, 201

#Route pour changer les données d'un utilisateur
@app.route('/<domaine>/updateUserData', methods=['POST'])
def update_user_data(domaine):
    user_id = request.json['user_id']
    firstname = request.json['firstname']
    lastname = request.json['lastname']
    color = request.json['color']
    initial = request.json['initial']

    conn = get_db_connection()
    cur = conn.cursor()

    domaineUser = domaine + '_user'

    # Créer la réservation
    query = sql.SQL('''
        UPDATE {domaine_user}
        SET firstname = %s,
            lastname = %s,
            color = %s,
            initial = %s
        WHERE id = %s;
    ''').format(
        domaine_user=sql.Identifier(domaineUser)
    )
    cur.execute(query, (firstname, lastname, color, initial, user_id))
    conn.commit()

    cur.close()
    conn.close()

    response = jsonify({"message": "User updated"})
    response.headers.add('Access-Control-Allow-Origin', '*')

    return response, 201

#Annuler une réservation pour un employé
@app.route('/<domaine>/reservations', methods=['DELETE'])
def cancel_reservation(domaine):
    user_id = request.json['user_id']
    site_id = request.json['site_id']
    date = request.json['date']

    conn = get_db_connection()
    cur = conn.cursor()

    domaineReservation = domaine + '_reservation'

    # Vérifier si une réservation existe pour cet employé à cette date
    query = sql.SQL('''
        SELECT *
        FROM 
            {domaine_reservation}
        WHERE
            user_id = %s
            AND date = %s
            AND site_id = %s
    ''').format(
        domaine_reservation=sql.Identifier(domaineReservation)
    )
    cur.execute(query, (user_id, date, site_id))
    existing_reservation = cur.fetchone()

    if not existing_reservation:
        cur.close()
        conn.close()

        response = jsonify({"message": "Reservation doesn't already exists for this worker on this date"})
        response.headers.add('Access-Control-Allow-Origin', '*')

        return response, 400

    # Supprimer la réservation
    query = sql.SQL('''
        DELETE FROM 
           {domaine_reservation}
        WHERE 
            user_id = %s
            AND site_id = %s 
            AND date = %s
    ''').format(
        domaine_reservation=sql.Identifier(domaineReservation)
    )
    cur.execute(query, (user_id, site_id, date))
    conn.commit()

    queryLog = sql.SQL('''
        INSERT INTO log (credential_id, request_type, request_data)
        VALUES (
            (SELECT id FROM credential WHERE user_id = %s),
            'Suppression réservation',
            %s
        )
    ''')
    cur.execute(queryLog, (user_id, cur.mogrify(query, (user_id, site_id, date)).decode('utf-8')))
    conn.commit()

    cur.close()
    conn.close()

    response = jsonify({"message": "Reservation deleted"})
    response.headers.add('Access-Control-Allow-Origin', '*')

    return response


# #Lister toutes les réservations pour un site sur une période donnée
# #Pour tester : http://127.0.0.1:5000/reservations/site/f09a4628-5b67-4445-a266-130177afaf98/period?start_date=2024-10-01&end_date=2024-10-31
# @app.route('/reservations/site/<site_id>/period', methods=['GET'])
# def get_reservations_for_site_in_period(site_id):
#     start_date = request.args.get('start_date')
#     end_date = request.args.get('end_date')
#
#     conn = get_db_connection()
#     cur = conn.cursor()
#
#     query = '''
#         SELECT
#             r.date,
#             w.id AS worker_id
#         FROM
#             reservation r
#         JOIN
#             worker w ON r.worker_id = w.id
#         WHERE
#             r.site_id = %s
#             AND r.date BETWEEN %s AND %s
#         ORDER BY
#             r.date
#     '''
#     cur.execute(query,(site_id, start_date, end_date))
#     rows = cur.fetchall()
#
#     reservations = []
#     for row in rows:
#         reservations.append({
#             "date": row[0].strftime('%Y-%m-%d'),
#             "worker_id": row[1]
#         })
#
#     cur.close()
#     conn.close()
#
#     response = jsonify(reservations)
#     response.headers.add('Access-Control-Allow-Origin', '*')
#
#     return response


# Pas utiles pour l'instant je pense

# #Route pour récupérer les réservations d’un employé
# @app.route('/workers/<worker_id>/reservations', methods=['GET'])
# def get_worker_reservations(worker_id):
#     conn = get_db_connection()
#     cur = conn.cursor()
#
#     query = '''
#         SELECT
#             r.date,
#             s.name AS site_name
#         FROM
#             reservation r
#         JOIN
#             site s ON r.site_id = s.id
#         WHERE
#             r.worker_id = %s
#         ORDER BY
#             r.date
#     '''
#     cur.execute(query,(worker_id))
#     rows = cur.fetchall()
#
#     reservations = []
#     for row in rows:
#         reservations.append({
#             "date": row[0].strftime('%Y-%m-%d'),
#             "site_name": row[1]
#         })
#
#     cur.close()
#     conn.close()
#
#     response = jsonify(reservations)
#     response.headers.add('Access-Control-Allow-Origin', '*')
#
#     return response
#
# # Route pour obtenir les réservations d'un employé sur une période
# @app.route('/reservations/worker/<worker_id>/period', methods=['GET'])
# def get_worker_reservations_for_period(worker_id):
#     start_date = request.args.get('start_date')
#     end_date = request.args.get('end_date')
#
#     # Se connecter à la base de données
#     conn = get_db_connection()
#     cur = conn.cursor()
#
#     query = '''
#         SELECT
#             r.date,
#             s.name AS site_name
#         FROM
#             reservation r
#         JOIN
#             site s ON r.site_id = s.id
#         WHERE
#             r.worker_id = %s
#             AND r.date BETWEEN %s AND %s
#         ORDER BY r.date;
#     '''
#     cur.execute(query, (worker_id, start_date, end_date))
#     rows = cur.fetchall()
#
#     # Convertir les résultats en liste de dictionnaires pour être JSON serializable
#     reservations = []
#     for row in rows:
#         reservations.append({
#             "date": row[0].strftime('%Y-%m-%d'),  # Transformer la date en chaîne
#             "site_name": row[1]
#         })
#
#     # Fermer le curseur et la connexion
#     cur.close()
#     conn.close()
#
#     response = jsonify(reservations)
#     response.headers.add('Access-Control-Allow-Origin', '*')
#
#     return response
#
# #Lister les employés présents sur un site à une date donnée
# @app.route('/reservations/site/<site_id>/date', methods=['GET'])
# def get_workers_for_site_on_date(site_id):
#     date = request.args.get('date')
#
#     conn = get_db_connection()
#     cur = conn.cursor()
#
#     query = '''
#         SELECT
#             w.firstname AS worker_firstname,
#             w.lastname AS worker_lastname
#         FROM
#             reservation r
#         JOIN
#             worker w ON r.worker_id = w.id
#         WHERE
#             r.site_id = %s
#             AND r.date = %s
#     '''
#     cur.execute(query,(site_id, date))
#     rows = cur.fetchall()
#
#     workers = [{"worker_firstname": row[0],
#             "worker_lastname": row[1]} for row in rows]
#
#     cur.close()
#     conn.close()
#
#     response = jsonify(workers)
#     response.headers.add('Access-Control-Allow-Origin', '*')
#
#     return response
#
# #Obtenir le nombre de réservations pour un site sur une période donnée
# @app.route('/reservations/site/<site_id>/count', methods=['GET'])
# def get_reservation_count_for_site_in_period(site_id):
#     start_date = request.args.get('start_date')
#     end_date = request.args.get('end_date')
#
#     conn = get_db_connection()
#     cur = conn.cursor()
#
#     query = '''
#         SELECT
#             COUNT(*)
#         FROM
#             reservation
#         WHERE
#             site_id = %s
#             AND date BETWEEN %s AND %s
#     '''
#     cur.execute(query,(site_id, start_date, end_date))
#     count = cur.fetchone()[0]
#
#     cur.close()
#     conn.close()
#
#     response = jsonify({"reservation_count": count})
#     response.headers.add('Access-Control-Allow-Origin', '*')
#
#     return response
#
# #Lister les jours où aucun employé n’est prévu sur un site
# @app.route('/reservations/site/<site_id>/empty_days', methods=['GET'])
# def get_empty_days_for_site(site_id):
#     start_date = request.args.get('start_date')
#     end_date = request.args.get('end_date')
#
#     conn = get_db_connection()
#     cur = conn.cursor()
#
#     query = '''
#         SELECT
#             d.date
#         FROM
#             generate_series(%s::date, %s::date, '1 day'::interval) d(date)
#         LEFT JOIN
#             reservation r ON r.date = d.date AND r.site_id = %s
#         WHERE
#             r.id IS NULL;
#     '''
#     cur.execute(query, (start_date, end_date, site_id))
#     rows = cur.fetchall()
#
#     empty_days = [row[0].strftime('%Y-%m-%d') for row in rows]
#
#     cur.close()
#     conn.close()
#
#     response = jsonify({"empty_days": empty_days})
#     response.headers.add('Access-Control-Allow-Origin', '*')
#
#     return response

# Lancer l'application Flask
if __name__ == '__main__':

    app.run(host="192.168.1.8", debug=True)