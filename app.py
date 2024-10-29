from flask import Flask, jsonify, request, render_template
import psycopg2
from datetime import datetime, timedelta
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

# Fonction pour se connecter à la base de données PostgreSQL
def get_db_connection():
    conn = psycopg2.connect(
        host="dpg-csdbse08fa8c73907000-a.frankfurt-postgres.render.com",
        port='5432',
        dbname="reservation_v1",
        user="reservation_v1_user",
        password="oUWvegfUufKjyT21WRWpaRocf4fE1IWT",
        sslmode='require'
    )
    return conn

@app.route('/')
def home():
    return render_template('reservation.html')

#Route pour récupérer tous les travailleurs
#Pour tester : http://127.0.0.1:5000/workers
@app.route('/workers', methods=['GET'])
def get_workers():
    conn = get_db_connection()
    cur = conn.cursor()

    query = '''
        SELECT 
            id,
            firstname,
            lastname
        FROM 
            worker
    '''
    cur.execute(query)
    rows = cur.fetchall()

    workers = []
    for row in rows:
        workers.append({
            "id": row[0],
            "firstname": row[1],
            "lastname": row[2]
        })

    cur.close()
    conn.close()

    response = jsonify(workers)
    response.headers.add('Access-Control-Allow-Origin', '*')

    return response

#Route pour récupérer tous les sites
#Pour tester : http://127.0.0.1:5000/sites
@app.route('/sites', methods=['GET'])
def get_sites():
    conn = get_db_connection()
    cur = conn.cursor()

    query = '''
        SELECT 
            id,
            name
        FROM 
            site
    '''
    cur.execute(query)
    rows = cur.fetchall()

    sites = []
    for row in rows:
        sites.append({
            "id": row[0],
            "name": row[1]
        })

    cur.close()
    conn.close()

    response = jsonify(sites)
    response.headers.add('Access-Control-Allow-Origin', '*')

    return response

#Route pour créer une réservation
#Pour tester en curl:
'''
curl -X POST http://localhost:5000/reservations \
-H "Content-Type: application/json" \
-d '{
  "worker_id": "c23d1f3a-b967-4321-b521-c68a24d2cb9b",
  "site_id": "f09a4628-5b67-4445-a266-130177afaf98",
  "date": "2024-10-25"
}'
'''
@app.route('/reservations', methods=['POST'])
def create_reservation():
    worker_id = request.json['worker_id']
    site_id = request.json['site_id']
    date = request.json['date']

    conn = get_db_connection()
    cur = conn.cursor()

    # Vérifier si une réservation existe déjà pour cet employé à cette date
    query = '''
        SELECT *
        FROM 
            reservation
        WHERE
            worker_id = %s
            AND date = %s
    '''
    cur.execute(query, (worker_id, date))
    existing_reservation = cur.fetchone()

    if existing_reservation:
        cur.close()
        conn.close()

        response = jsonify({"message": "Reservation already exists for this worker on this date"})
        response.headers.add('Access-Control-Allow-Origin', '*')

        return response, 400

    # Créer la réservation
    query = '''
        INSERT INTO
            reservation (worker_id, site_id, date)
        VALUES
            (%s, %s, %s)
    '''
    cur.execute(query,(worker_id, site_id, date))
    conn.commit()

    cur.close()
    conn.close()

    response = jsonify({"message": "Reservation created"})
    response.headers.add('Access-Control-Allow-Origin', '*')

    return response, 201

#Annuler une réservation pour un employé
#Pour tester en curl:
'''
curl -X DELETE http://localhost:5000/reservations \
-H "Content-Type: application/json" \
-d '{
  "worker_id": "c23d1f3a-b967-4321-b521-c68a24d2cb9b",
  "site_id": "f09a4628-5b67-4445-a266-130177afaf98",
  "date": "2024-10-25"
}'
'''
@app.route('/reservations', methods=['DELETE'])
def cancel_reservation():
    worker_id = request.json['worker_id']
    site_id = request.json['site_id']
    date = request.json['date']

    conn = get_db_connection()
    cur = conn.cursor()

    # Vérifier si une réservation existe pour cet employé à cette date
    query = '''
            SELECT *
            FROM 
                reservation
            WHERE
                worker_id = %s
                AND date = %s
                AND site_id = %s
        '''
    cur.execute(query, (worker_id, date, site_id))
    existing_reservation = cur.fetchone()

    if not existing_reservation:
        cur.close()
        conn.close()

        response = jsonify({"message": "Reservation doesn't already exists for this worker on this date"})
        response.headers.add('Access-Control-Allow-Origin', '*')

        return response, 400

    # Supprimer la réservation
    query = '''
        DELETE FROM 
            reservation
        WHERE 
            worker_id = %s 
            AND date = %s
            AND site_id = %s
    '''
    cur.execute(query, (worker_id, date, site_id))
    conn.commit()

    cur.close()
    conn.close()

    response = jsonify({"message": "Reservation deleted"})
    response.headers.add('Access-Control-Allow-Origin', '*')

    return response

#Lister toutes les réservations pour un site sur une période donnée
#Pour tester : http://127.0.0.1:5000/reservations/site/f09a4628-5b67-4445-a266-130177afaf98/period?start_date=2024-10-01&end_date=2024-10-31
@app.route('/reservations/site/<site_id>/period', methods=['GET'])
def get_reservations_for_site_in_period(site_id):
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    conn = get_db_connection()
    cur = conn.cursor()

    query = '''
        SELECT 
            r.date, 
            w.id AS worker_id
        FROM 
            reservation r
        JOIN 
            worker w ON r.worker_id = w.id
        WHERE 
            r.site_id = %s 
            AND r.date BETWEEN %s AND %s
        ORDER BY 
            r.date
    '''
    cur.execute(query,(site_id, start_date, end_date))
    rows = cur.fetchall()

    reservations = []
    for row in rows:
        reservations.append({
            "date": row[0].strftime('%Y-%m-%d'),
            "worker_id": row[1]
        })

    cur.close()
    conn.close()

    response = jsonify(reservations)
    response.headers.add('Access-Control-Allow-Origin', '*')

    return response



#Lister toutes les réservations pour un site pour une semaine donnée
#Pour tester : http://127.0.0.1:5000/reservations/site/f09a4628-5b67-4445-a266-130177afaf98/week?start_date=2024-10-01
@app.route('/reservations/site/<site_id>/week', methods=['GET'])
def get_reservations_for_site_in_a_week(site_id):
    start_date = request.args.get('start_date')
    end_date = (datetime.strptime(start_date, '%Y-%m-%d') + timedelta(days=5)).strftime('%Y-%m-%d')

    conn = get_db_connection()
    cur = conn.cursor()

    query = '''
        SELECT 
            r.date, 
            w.id AS worker_id
        FROM 
            reservation r
        JOIN 
            worker w ON r.worker_id = w.id
        WHERE 
            r.site_id = %s 
            AND r.date BETWEEN %s AND %s
        ORDER BY 
            r.date
    '''
    cur.execute(query,(site_id, start_date, end_date))
    rows = cur.fetchall()

    reservations = []
    for row in rows:
        reservations.append({
            "date": row[0].strftime('%Y-%m-%d'),
            "worker_id": row[1]
        })

    cur.close()
    conn.close()

    response = jsonify(reservations)
    response.headers.add('Access-Control-Allow-Origin', '*')

    return response




# Pas utiles pour l'instant je pense

#Route pour récupérer les réservations d’un employé
@app.route('/workers/<worker_id>/reservations', methods=['GET'])
def get_worker_reservations(worker_id):
    conn = get_db_connection()
    cur = conn.cursor()

    query = '''
        SELECT
            r.date,
            s.name AS site_name
        FROM
            reservation r
        JOIN 
            site s ON r.site_id = s.id
        WHERE 
            r.worker_id = %s
        ORDER BY 
            r.date
    '''
    cur.execute(query,(worker_id))
    rows = cur.fetchall()

    reservations = []
    for row in rows:
        reservations.append({
            "date": row[0].strftime('%Y-%m-%d'),
            "site_name": row[1]
        })

    cur.close()
    conn.close()

    response = jsonify(reservations)
    response.headers.add('Access-Control-Allow-Origin', '*')

    return response

# Route pour obtenir les réservations d'un employé sur une période
@app.route('/reservations/worker/<worker_id>/period', methods=['GET'])
def get_worker_reservations_for_period(worker_id):
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    # Se connecter à la base de données
    conn = get_db_connection()
    cur = conn.cursor()

    query = '''
        SELECT 
            r.date, 
            s.name AS site_name
        FROM 
            reservation r
        JOIN 
            site s ON r.site_id = s.id
        WHERE 
            r.worker_id = %s
            AND r.date BETWEEN %s AND %s
        ORDER BY r.date;
    '''
    cur.execute(query, (worker_id, start_date, end_date))
    rows = cur.fetchall()

    # Convertir les résultats en liste de dictionnaires pour être JSON serializable
    reservations = []
    for row in rows:
        reservations.append({
            "date": row[0].strftime('%Y-%m-%d'),  # Transformer la date en chaîne
            "site_name": row[1]
        })
    
    # Fermer le curseur et la connexion
    cur.close()
    conn.close()

    response = jsonify(reservations)
    response.headers.add('Access-Control-Allow-Origin', '*')

    return response

#Lister les employés présents sur un site à une date donnée
@app.route('/reservations/site/<site_id>/date', methods=['GET'])
def get_workers_for_site_on_date(site_id):
    date = request.args.get('date')

    conn = get_db_connection()
    cur = conn.cursor()

    query = '''
        SELECT 
            w.firstname AS worker_firstname,
            w.lastname AS worker_lastname
        FROM 
            reservation r
        JOIN 
            worker w ON r.worker_id = w.id
        WHERE 
            r.site_id = %s 
            AND r.date = %s
    '''
    cur.execute(query,(site_id, date))
    rows = cur.fetchall()

    workers = [{"worker_firstname": row[0],
            "worker_lastname": row[1]} for row in rows]

    cur.close()
    conn.close()

    response = jsonify(workers)
    response.headers.add('Access-Control-Allow-Origin', '*')

    return response

#Obtenir le nombre de réservations pour un site sur une période donnée
@app.route('/reservations/site/<site_id>/count', methods=['GET'])
def get_reservation_count_for_site_in_period(site_id):
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    conn = get_db_connection()
    cur = conn.cursor()

    query = '''
        SELECT 
            COUNT(*)
        FROM 
            reservation
        WHERE 
            site_id = %s 
            AND date BETWEEN %s AND %s
    '''
    cur.execute(query,(site_id, start_date, end_date))
    count = cur.fetchone()[0]

    cur.close()
    conn.close()

    response = jsonify({"reservation_count": count})
    response.headers.add('Access-Control-Allow-Origin', '*')

    return response

#Lister les jours où aucun employé n’est prévu sur un site
@app.route('/reservations/site/<site_id>/empty_days', methods=['GET'])
def get_empty_days_for_site(site_id):
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    conn = get_db_connection()
    cur = conn.cursor()

    query = '''
        SELECT 
            d.date
        FROM 
            generate_series(%s::date, %s::date, '1 day'::interval) d(date)
        LEFT JOIN 
            reservation r ON r.date = d.date AND r.site_id = %s
        WHERE 
            r.id IS NULL;
    '''
    cur.execute(query, (start_date, end_date, site_id))
    rows = cur.fetchall()

    empty_days = [row[0].strftime('%Y-%m-%d') for row in rows]

    cur.close()
    conn.close()

    response = jsonify({"empty_days": empty_days})
    response.headers.add('Access-Control-Allow-Origin', '*')

    return response


# Lancer l'application Flask
if __name__ == '__main__':
    app.run(host='192.168.1.8', debug=True)
    #app.run(debug=True)
