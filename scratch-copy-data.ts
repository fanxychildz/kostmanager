import { createClient } from '@libsql/client';
import { nanoid } from 'nanoid';

const FROM_OWNER_ID = 'm7xjIMj5Wp35jVWwyb8kJsiiFSn7cMVS'; // taufiqrusdhi.ez@gmail.com
const TO_OWNER_ID = 'BHA26HuCyGL74XCq0pRoufbw1qWTaYZo';   // owner@demo.com

async function run() {
  const client = createClient({
    url: 'libsql://kost-management-fanxychildz.aws-us-west-2.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODA5MjA3ODIsImlkIjoiMDE5ZWE3MTctMjAwMS03ZjZlLThkNTktZWNkYzcxMGRkMTU5IiwicmlkIjoiMjM1M2NkOTctMGRkMS00MDAxLTliYjAtZDE2OTkwMTIyZjAzIn0.Kn_e7FEKkmAvrJGK_23q4qw2oAq1JVjQfeguiuZ_Fe7Xa00pBqcAiQuZeJk3T6WiFlsTnyDAGxEaxyHpOrLiBw',
  });

  try {
    // 1. Get properties
    console.log('Fetching properties...');
    const props = await client.execute({
      sql: "SELECT * FROM properties WHERE owner_id = ?;",
      args: [FROM_OWNER_ID]
    });

    for (const p of props.rows) {
      const oldPropId = p.id as string;
      // Check if property with same name already exists for TO_OWNER_ID
      const checkProp = await client.execute({
        sql: "SELECT id FROM properties WHERE owner_id = ? AND name = ?;",
        args: [TO_OWNER_ID, p.name]
      });

      let newPropId = '';
      if (checkProp.rows.length > 0) {
        newPropId = checkProp.rows[0].id as string;
        console.log(`Property '${p.name}' already exists for TO_OWNER. Reusing ID: ${newPropId}`);
      } else {
        newPropId = nanoid();
        console.log(`Duplicating property '${p.name}' (${oldPropId} -> ${newPropId})...`);
        await client.execute({
          sql: "INSERT INTO properties (id, owner_id, name, address, city, province, type, image, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
          args: [newPropId, TO_OWNER_ID, p.name, p.address, p.city, p.province, p.type, p.image, p.created_at, p.updated_at]
        });
      }

      // 2. Duplicate units for this property
      const units = await client.execute({
        sql: "SELECT * FROM units WHERE property_id = ?;",
        args: [oldPropId]
      });

      const unitIdMap = new Map<string, string>(); // oldUnitId -> newUnitId

      for (const u of units.rows) {
        const oldUnitId = u.id as string;
        const checkUnit = await client.execute({
          sql: "SELECT id FROM units WHERE property_id = ? AND unit_number = ?;",
          args: [newPropId, u.unit_number]
        });

        let newUnitId = '';
        if (checkUnit.rows.length > 0) {
          newUnitId = checkUnit.rows[0].id as string;
          console.log(`  Unit '${u.unit_number}' already exists. Reusing ID: ${newUnitId}`);
        } else {
          newUnitId = nanoid();
          console.log(`  Duplicating unit '${u.unit_number}'...`);
          await client.execute({
            sql: "INSERT INTO units (id, property_id, unit_number, type, price_monthly, status, facilities, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);",
            args: [newUnitId, newPropId, u.unit_number, u.type, u.price_monthly, u.status, u.facilities, u.created_at, u.updated_at]
          });
        }
        unitIdMap.set(oldUnitId, newUnitId);
      }

      // 3. Duplicate tenants for this property
      const tenants = await client.execute({
        sql: "SELECT * FROM tenants WHERE property_id = ?;",
        args: [oldPropId]
      });

      const tenantIdMap = new Map<string, string>(); // oldTenantId -> newTenantId

      for (const t of tenants.rows) {
        const oldTenantId = t.id as string;
        const checkTenant = await client.execute({
          sql: "SELECT id FROM tenants WHERE property_id = ? AND email = ?;",
          args: [newPropId, t.email]
        });

        let newTenantId = '';
        const newUnitId = unitIdMap.get(t.unit_id as string);
        if (!newUnitId) {
          console.warn(`  Warning: new unit ID not found for tenant ${t.full_name}`);
          continue;
        }

        if (checkTenant.rows.length > 0) {
          newTenantId = checkTenant.rows[0].id as string;
          console.log(`  Tenant '${t.full_name}' already exists. Reusing ID: ${newTenantId}`);
        } else {
          newTenantId = nanoid();
          console.log(`  Duplicating tenant '${t.full_name}'...`);
          await client.execute({
            sql: "INSERT INTO tenants (id, user_id, unit_id, property_id, full_name, ktp_number, ktp_photo_url, phone, email, occupation, check_in_date, check_out_date, deposit_amount, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
            args: [newTenantId, t.user_id, newUnitId, newPropId, t.full_name, t.ktp_number, t.ktp_photo_url, t.phone, t.email, t.occupation, t.check_in_date, t.check_out_date, t.deposit_amount, t.status, t.created_at, t.updated_at]
          });
        }
        tenantIdMap.set(oldTenantId, newTenantId);

        // 4. Duplicate bills for this tenant
        const bills = await client.execute({
          sql: "SELECT * FROM bills WHERE tenant_id = ?;",
          args: [oldTenantId]
        });

        for (const b of bills.rows) {
          const oldBillId = b.id as string;
          const checkBill = await client.execute({
            sql: "SELECT id FROM bills WHERE tenant_id = ? AND period_month = ? AND period_year = ?;",
            args: [newTenantId, b.period_month, b.period_year]
          });

          let newBillId = '';
          if (checkBill.rows.length > 0) {
            newBillId = checkBill.rows[0].id as string;
            console.log(`    Bill for month ${b.period_month}/${b.period_year} already exists. Reusing ID: ${newBillId}`);
          } else {
            newBillId = nanoid();
            console.log(`    Duplicating bill for month ${b.period_month}/${b.period_year}...`);
            await client.execute({
              sql: "INSERT INTO bills (id, tenant_id, unit_id, period_month, period_year, rent_amount, electricity_amount, water_amount, wifi_amount, other_amount, total_amount, due_date, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
              args: [newBillId, newTenantId, newUnitId, b.period_month, b.period_year, b.rent_amount, b.electricity_amount, b.water_amount, b.wifi_amount, b.other_amount, b.total_amount, b.due_date, b.status, b.created_at, b.updated_at]
            });
          }

          // 5. Duplicate payments for this bill
          const payments = await client.execute({
            sql: "SELECT * FROM payments WHERE bill_id = ?;",
            args: [oldBillId]
          });

          for (const pay of payments.rows) {
            const checkPay = await client.execute({
              sql: "SELECT id FROM payments WHERE bill_id = ? AND paid_at = ? AND amount = ?;",
              args: [newBillId, pay.paid_at, pay.amount]
            });

            if (checkPay.rows.length > 0) {
              console.log(`      Payment already exists. Skipping.`);
            } else {
              const newPayId = nanoid();
              console.log(`      Duplicating payment of ${pay.amount}...`);
              await client.execute({
                sql: "INSERT INTO payments (id, bill_id, recorded_by, payment_method, amount, paid_at, notes, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
                args: [newPayId, newBillId, TO_OWNER_ID, pay.payment_method, pay.amount, pay.paid_at, pay.notes, pay.status, pay.created_at, pay.updated_at]
              });
            }
          }
        }
      }

      // 6. Duplicate expenses for this property
      const expenses = await client.execute({
        sql: "SELECT * FROM expenses WHERE property_id = ?;",
        args: [oldPropId]
      });

      for (const ex of expenses.rows) {
        const checkEx = await client.execute({
          sql: "SELECT id FROM expenses WHERE property_id = ? AND title = ? AND date = ?;",
          args: [newPropId, ex.title, ex.date]
        });

        if (checkEx.rows.length > 0) {
          console.log(`  Expense '${ex.title}' already exists. Skipping.`);
        } else {
          const newExId = nanoid();
          console.log(`  Duplicating expense '${ex.title}'...`);
          await client.execute({
            sql: "INSERT INTO expenses (id, property_id, title, amount, category, date, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);",
            args: [newExId, newPropId, ex.title, ex.amount, ex.category, ex.date, ex.notes, ex.created_at, ex.updated_at]
          });
        }
      }

      // 7. Duplicate maintenance requests
      const maintReqs = await client.execute({
        sql: "SELECT * FROM maintenance_requests WHERE property_id = ?;",
        args: [oldPropId]
      });

      for (const mr of maintReqs.rows) {
        const oldMrId = mr.id as string;
        const checkMr = await client.execute({
          sql: "SELECT id FROM maintenance_requests WHERE property_id = ? AND title = ? AND created_at = ?;",
          args: [newPropId, mr.title, mr.created_at]
        });

        let newMrId = '';
        const newUnitId = unitIdMap.get(mr.unit_id as string);
        const newTenantId = mr.tenant_id ? tenantIdMap.get(mr.tenant_id as string) : null;

        if (checkMr.rows.length > 0) {
          newMrId = checkMr.rows[0].id as string;
          console.log(`  Maintenance request '${mr.title}' already exists. Reusing ID: ${newMrId}`);
        } else {
          newMrId = nanoid();
          console.log(`  Duplicating maintenance request '${mr.title}'...`);
          await client.execute({
            sql: "INSERT INTO maintenance_requests (id, tenant_id, property_id, unit_id, title, description, category, priority, status, photo_url, repair_cost, created_at, updated_at, resolved_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
            args: [newMrId, newTenantId, newPropId, newUnitId, mr.title, mr.description, mr.category, mr.priority, mr.status, mr.photo_url, mr.repair_cost, mr.created_at, mr.updated_at, mr.resolved_at]
          });
        }

        // 8. Duplicate maintenance updates
        const maintUpdates = await client.execute({
          sql: "SELECT * FROM maintenance_updates WHERE request_id = ?;",
          args: [oldMrId]
        });

        for (const mu of maintUpdates.rows) {
          const checkMu = await client.execute({
            sql: "SELECT id FROM maintenance_updates WHERE request_id = ? AND text = ? AND created_at = ?;",
            args: [newMrId, mu.text, mu.created_at]
          });

          if (checkMu.rows.length > 0) {
            console.log(`    Maintenance update already exists. Skipping.`);
          } else {
            const newMuId = nanoid();
            console.log(`    Duplicating maintenance update...`);
            await client.execute({
              sql: "INSERT INTO maintenance_updates (id, request_id, author_id, author_name, text, created_at) VALUES (?, ?, ?, ?, ?, ?);",
              args: [newMuId, newMrId, TO_OWNER_ID, mu.author_name, mu.text, mu.created_at]
            });
          }
        }
      }

      // 9. Duplicate announcements
      const anns = await client.execute({
        sql: "SELECT * FROM announcements WHERE property_id = ?;",
        args: [oldPropId]
      });

      for (const a of anns.rows) {
        const checkAnn = await client.execute({
          sql: "SELECT id FROM announcements WHERE property_id = ? AND title = ? AND created_at = ?;",
          args: [newPropId, a.title, a.created_at]
        });

        if (checkAnn.rows.length > 0) {
          console.log(`  Announcement '${a.title}' already exists. Skipping.`);
        } else {
          const newAnnId = nanoid();
          const newTenantId = a.target_tenant_id ? tenantIdMap.get(a.target_tenant_id as string) : null;
          console.log(`  Duplicating announcement '${a.title}'...`);
          await client.execute({
            sql: "INSERT INTO announcements (id, property_id, title, body, channel, audience, target_tenant_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);",
            args: [newAnnId, newPropId, a.title, a.body, a.channel, a.audience, newTenantId, a.created_at, a.updated_at]
          });
        }
      }
    }

    console.log('\nSUCCESS: Data duplication complete!');
  } catch (err: any) {
    console.error('Error:', err.message || err);
  } finally {
    client.close();
  }
}

run();
