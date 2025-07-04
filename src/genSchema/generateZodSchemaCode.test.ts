import { generateZodSchemaCode } from './generateZodSchemaCode.js'
import { type FieldDetail, getDetailsFromDefinition } from './getDetailsFromDefinition.js'

describe('generateZodSchemaCode', () => {
	describe('basic schema', () => {
		it('returns schema for simple object', () => {
			const definition = `
                DEFINE FIELD reviews ON TABLE product TYPE array<string>;
                DEFINE FIELD user ON TABLE product TYPE record<user>;
                DEFINE FIELD rating ON TABLE product TYPE number;
            `
			const fields = definition
				.split(';')
				.filter(x => x.trim().length)
				.map(def => getDetailsFromDefinition(def, false))
			const generatedSchema = generateZodSchemaCode(fields, 'schema')

			expect(generatedSchema).toEqualIgnoringWhitespace(`
                const schema = z.object({
                    reviews: z.array(z.string()),
                    user: recordId('user'),
                    rating: z.number()
                })
            `)
		})
	})

	describe('Backticked and special field name handling', () => {
		it('strips backticks from simple field names', () => {
			const fields: FieldDetail[] = [
				{ name: '`type`', table: 'test', zodString: 'z.string()', skip: false },
				{ name: '`value`', table: 'test', zodString: 'z.number()', skip: false },
			]
			const result = generateZodSchemaCode(fields, 'testSchema')
			expect(result).toEqualIgnoringWhitespace(`
                const testSchema = z.object({
                    type: z.string(),
                    value: z.number()
                })
            `)
		})

		it('strips backticks and quotes field names containing hyphens', () => {
			const fields: FieldDetail[] = [
				{ name: '`max-value`', table: 'test', zodString: 'z.number()', skip: false },
				{ name: '`field-with-hyphen`', table: 'test', zodString: 'z.string()', skip: false },
			]
			const result = generateZodSchemaCode(fields, 'testSchema')
			expect(result).toEqualIgnoringWhitespace(`
                const testSchema = z.object({
                    "max-value": z.number(),
                    "field-with-hyphen": z.string()
                })
            `)
		})

		it('strips backticks from field names that are JavaScript reserved words and quotes them', () => {
			const fields: FieldDetail[] = [
				{ name: '`default`', table: 'test', zodString: 'z.string()', skip: false },
				{ name: '`const`', table: 'test', zodString: 'z.number()', skip: false },
			]
			const result = generateZodSchemaCode(fields, 'testSchema')
			// Assuming your sanitizeJSKey or equivalent quotes reserved words
			expect(result).toEqualIgnoringWhitespace(`
                const testSchema = z.object({
                    default: z.string(),
                    const: z.number()
                })
            `)
		})
	})

	describe('object schema', () => {
		it('returns schema for simple object', () => {
			const definition = `
                DEFINE FIELD review ON TABLE product TYPE object;
                DEFINE FIELD review.rating ON TABLE product TYPE number;
                DEFINE FIELD review.comment ON TABLE product TYPE string;
            `
			const fields = definition
				.split(';')
				.filter(x => x.trim().length)
				.map(def => getDetailsFromDefinition(def, false))
			const generatedSchema = generateZodSchemaCode(fields, 'schema')

			expect(generatedSchema).toEqualIgnoringWhitespace(`
                const schema = z.object({
                    review: z.object({
                        rating: z.number(),
                        comment: z.string()
                    })
                })
            `)
		})

		it('returns schema for optional object', () => {
			const definition = `
                DEFINE FIELD review ON TABLE product TYPE option<object>;
                DEFINE FIELD review.rating ON TABLE product TYPE number;
                DEFINE FIELD review.comment ON TABLE product TYPE string;
            `
			const fields = definition
				.split(';')
				.filter(x => x.trim().length)
				.map(def => getDetailsFromDefinition(def, false))
			const generatedSchema = generateZodSchemaCode(fields, 'schema')

			expect(generatedSchema).toEqualIgnoringWhitespace(`
                const schema = z.object({
                    review: z.object({
                        rating: z.number(),
                        comment: z.string()
                    }).optional()
                })
            `)
		})

		it('returns schema for optional object derived from all values being optional', () => {
			const definition = `
                DEFINE FIELD review ON TABLE product TYPE object;
                DEFINE FIELD review.rating ON TABLE product TYPE option<number>;
                DEFINE FIELD review.comment ON TABLE product TYPE option<string>;
            `
			const fields = definition
				.split(';')
				.filter(x => x.trim().length)
				.map(def => getDetailsFromDefinition(def, false))
			const generatedSchema = generateZodSchemaCode(fields, 'schema')

			expect(generatedSchema).toEqualIgnoringWhitespace(`
                const schema = z.object({
                    review: z.object({
                        rating: z.number().optional(),
                        comment: z.string().optional()
                    }).optional()
                })
            `)
		})

		it('returns schema for object with nested array', () => {
			const definition = `
                DEFINE FIELD review ON TABLE product TYPE object;
                DEFINE FIELD review.related ON TABLE product TYPE array<object>;
                DEFINE FIELD review.related[*].name ON TABLE product TYPE string;
                DEFINE FIELD review.related[*].rating ON TABLE product TYPE number;
            `
			const fields = definition
				.split(';')
				.filter(x => x.trim().length)
				.map(def => getDetailsFromDefinition(def, false))
			const generatedSchema = generateZodSchemaCode(fields, 'schema')

			expect(generatedSchema).toEqualIgnoringWhitespace(`
                const schema = z.object({
                    review: z.object({
                        related: z.object({
                            name: z.string(),
                            rating: z.number()
                        }).array()
                    })
                })
            `)
		})

		it('returns schema for complex object', () => {
			const definition = `
                DEFINE FIELD name ON TABLE product TYPE string;
                DEFINE FIELD price ON TABLE product TYPE number;
                DEFINE FIELD published_at ON TABLE product TYPE datetime;
                DEFINE FIELD is_published ON TABLE product TYPE bool;
                DEFINE FIELD related_authors ON TABLE product TYPE option<array<record<author>>>;
                DEFINE FIELD review ON TABLE product TYPE object;
                DEFINE FIELD review.rating ON TABLE product TYPE number;
                DEFINE FIELD review.comment ON TABLE product TYPE string;
                DEFINE FIELD review.author ON TABLE product TYPE object;
                DEFINE FIELD review.author.name ON TABLE product TYPE string;
                DEFINE FIELD review.author.email ON TABLE product TYPE string;
                DEFINE FIELD review.author.tags ON TABLE product TYPE array<string>;
                DEFINE FIELD review.author.user ON TABLE product TYPE record<user>;
                DEFINE FIELD review.related ON TABLE product TYPE array<object>;
                DEFINE FIELD review.related[*].name ON TABLE product TYPE string;
                DEFINE FIELD review.related[*].rating ON TABLE product TYPE number;
                DEFINE FIELD review.related[*].book ON TABLE product TYPE record<book>;
                DEFINE FIELD review.related[*].meta ON TABLE product type object;
                DEFINE FIELD review.related[*].meta.rating ON TABLE product TYPE number;
                DEFINE FIELD review.related[*].meta.comment ON TABLE product TYPE string;
                DEFINE FIELD review.related[*].meta.tags ON TABLE product TYPE array<string>;
            `
			const fields = definition
				.split(';')
				.filter(x => x.trim().length)
				.map(def => getDetailsFromDefinition(def, false))
			const generatedSchema = generateZodSchemaCode(fields, 'schema')

			expect(generatedSchema).toEqualIgnoringWhitespace(`
                const schema = z.object({
                    name: z.string(),
                    price: z.number(),
                    published_at: z.string().datetime(),
                    is_published: z.boolean(),
                    related_authors: recordId('author').array().optional(),
                    review: z.object({
                        rating: z.number(),
                        comment: z.string(),
                        author: z.object({
                            name: z.string(),
                            email: z.string(),
                            tags: z.array(z.string()),
                            user: recordId('user')
                        }),
                        related: z.object({
                            name: z.string(),
                            rating: z.number(),
                            book: recordId('book'),
                            meta: z.object({
                                rating: z.number(),
                                comment: z.string(),
                                tags: z.array(z.string())
                            })
                        }).array()
                    })
                })
            `)
		})

		it('returns schema for complex object with duplicate field with asterisk syntax', () => {
			const definition = `
                DEFINE FIELD review ON TABLE product TYPE object;
                DEFINE FIELD review.rating ON TABLE product TYPE number;
                DEFINE FIELD review.comment ON TABLE product TYPE string;
                DEFINE FIELD review.author ON TABLE product TYPE object;
                DEFINE FIELD review.author.name ON TABLE product TYPE string;
                DEFINE FIELD review.author.email ON TABLE product TYPE string;
                DEFINE FIELD review.author.tags ON TABLE product TYPE array<string>;
                DEFINE FIELD review.author.tags[*] ON TABLE product TYPE string;
                DEFINE FIELD review.author.user ON TABLE product TYPE record<user>;
            `
			const fields = definition
				.split(';')
				.filter(x => x.trim().length)
				.map(def => getDetailsFromDefinition(def, false))
			const generatedSchema = generateZodSchemaCode(fields, 'schema')

			expect(generatedSchema).toEqualIgnoringWhitespace(`
                const schema = z.object({
                    review: z.object({
                        rating: z.number(),
                        comment: z.string(),
                        author: z.object({
                            name: z.string(),
                            email: z.string(),
                            tags: z.string().array(),
                            user: recordId('user')
                        })
                    })
                })
            `)
		})

        // it('returns schema for double nested arrays', () => {
        //     const definition = `
        //         DEFINE FIELD responses ON TABLE survey TYPE array<object>;
        //         DEFINE FIELD responses[*].answers ON TABLE survey TYPE array<object>;
        //         DEFINE FIELD responses[*].answers[*].value ON TABLE survey TYPE string;
        //     `
        //     const fields = definition
        //         .split(';')
        //         .filter(x => x.trim().length)
        //         .map(def => getDetailsFromDefinition(def, false))
        //     const generatedSchema = generateZodSchemaCode(fields, 'schema')

        //     expect(generatedSchema).toEqualIgnoringWhitespace(`
        //         const schema = z.object({
        //             responses: z.object({
        //                 answers: z.object({
        //                     value: z.string()
        //                 }).array()
        //             }).array()
        //         })
        //     `)
        // })

        
        it('returns schema with record inside object array', () => {
            const definition = `
                DEFINE FIELD review ON TABLE product TYPE object;
                DEFINE FIELD review.related_users ON TABLE product TYPE array<record<user>>;
            `
            const fields = definition
                .split(';')
                .filter(x => x.trim().length)
                .map(def => getDetailsFromDefinition(def, false))
            const generatedSchema = generateZodSchemaCode(fields, 'schema')

            expect(generatedSchema).toEqualIgnoringWhitespace(`
                const schema = z.object({
                    review: z.object({
                        related_users: recordId('user').array()
                    })
                })
            `)
        })


        it('returns schema for top-level object array containing a record', () => {
            const definition = `
                DEFINE FIELD responses ON TABLE survey TYPE array<object>;
                DEFINE FIELD responses[*].user ON TABLE survey TYPE record<user>;
            `
            const fields = definition
                .split(';')
                .filter(x => x.trim().length)
                .map(def => getDetailsFromDefinition(def, false))
            const generatedSchema = generateZodSchemaCode(fields, 'schema')

            expect(generatedSchema).toEqualIgnoringWhitespace(`
                const schema = z.object({
                    responses: z.object({
                        user: recordId('user')
                    }).array()
                })
            `)
        })

        // it('handles nested arrays of objects with primitive values', () => {
        //     const definition = `
        //         DEFINE FIELD responses ON TABLE survey TYPE array<object>;
        //         DEFINE FIELD responses[*].answers ON TABLE survey TYPE array<object>;
        //         DEFINE FIELD responses[*].answers[*].value ON TABLE survey TYPE string;
        //     `
        //     const fields = definition
        //         .split(';')
        //         .filter(x => x.trim().length)
        //         .map(def => getDetailsFromDefinition(def, false))
        //     const generatedSchema = generateZodSchemaCode(fields, 'schema')

        //     expect(generatedSchema).toEqualIgnoringWhitespace(`
        //         const schema = z.object({
        //             responses: z.object({
        //                 answers: z.object({
        //                     value: z.string()
        //                 }).array()
        //             }).array()
        //         })
        //     `)
        // })


        it('handles array of records correctly', () => {
            const definition = `
                DEFINE FIELD collaborators ON TABLE project TYPE array<record<user>>;
            `
            const fields = definition
                .split(';')
                .filter(x => x.trim().length)
                .map(def => getDetailsFromDefinition(def, false))
            const generatedSchema = generateZodSchemaCode(fields, 'schema')

            expect(generatedSchema).toEqualIgnoringWhitespace(`
                const schema = z.object({
                    collaborators: recordId('user').array()
                })
            `)
        })


	})
})
