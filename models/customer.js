"use strict";

/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
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

  /** get a customer by Full Name. */
  static getByName(customers, searchedName) {
    const name = searchedName.split(" ");
    let searchCustomer, listOfCustomers;
    // Do a query thru DB for matching name NOT IN THE ROUTES!!!
    if (name.length === 1) {
      listOfCustomers = customers.filter(
        customer => customer.firstName === name[0] ||
        customer.lastName === name[0]);
    } else {
      searchCustomer = customers.filter(customer => customer.fullName() === searchedName);
    }

    if ((searchCustomer || listOfCustomers) === undefined) {
      const err = new Error(`No such customer: ${searchedName}`);
      err.status = 404;
      throw err;
    }
    return (searchCustomer || listOfCustomers);
  }

  /** get a customer's full name */
  fullName() {
    return `${this.firstName} ${this.lastName}`;
  }


  /** Get top 10 customers by reservations */
  static async getTop10() {
    const results = await db.query(
      `SELECT customers.id, customers.first_name AS "firstName", customers.last_name AS "lastName", customers.phone,
        customers.notes FROM customers
        JOIN reservations ON customers.id = reservations.customer_id
        GROUP BY customers.id, customers.first_name, customers.last_name, customers.phone, customers.notes
        ORDER BY COUNT(customer_id) DESC LIMIT 10;`)

    return results.rows.map(
      c => new Customer(c));
  }



  /** get all reservations for this customer. */

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

