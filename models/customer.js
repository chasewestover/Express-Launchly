"use strict";

/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");
const QUERY = `SELECT id,
first_name AS "firstName",
last_name  AS "lastName",
phone,
notes
FROM customers`

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }



  static async search(name) {
    let splitName = name.split(' ');
    // if two names passed 
    if (splitName.length === 2){
      splitName = splitName.map(s => "%" + s.toLowerCase() + "%")
      const results = await db.query(
        `${QUERY}
         WHERE LOWER(first_name) LIKE $1 AND LOWER(last_name) LIKE $2
         ORDER BY last_name, first_name`, splitName)
      return results.rows.map(row => new Customer(row));
    } else {
      name = '%' + name.toLowerCase() + '%';
      const results = await db.query(
        `${QUERY}
         WHERE LOWER(first_name) LIKE $1 OR LOWER(last_name) LIKE $1
         ORDER BY last_name, first_name`, [name])
      console.log(results, name);
      return results.rows.map(row => new Customer(row));
    }
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
          `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           ORDER BY last_name, first_name`,
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
          `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE id = $1`,
        [id],
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** get all reservations for this customer. */


  //get full name for a customer
  getFullName() {
    return this.firstName + " " + this.lastName;
  }

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
            `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
          [this.firstName, this.lastName, this.phone, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
            `UPDATE customers
             SET first_name=$1,
                 last_name=$2,
                 phone=$3,
                 notes=$4
             WHERE id = $5`, [
            this.firstName,
            this.lastName,
            this.phone,
            this.notes,
            this.id,
          ],
      );
    }
  }
}

module.exports = Customer;
